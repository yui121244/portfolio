export const backgroundCausticsVertexShader = /* glsl */ `
  varying vec2 vUv;

  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`

export const backgroundCausticsFragmentShader = /* glsl */ `
  precision highp float;

  uniform float uTime;
  uniform float uAspect;
  uniform float uBackgroundMix;
  varying vec2 vUv;

  float hash21(vec2 point) {
    point = fract(point * vec2(123.34, 456.21));
    point += dot(point, point + 45.32);
    return fract(point.x * point.y);
  }

  float valueNoise(vec2 point) {
    vec2 index = floor(point);
    vec2 fraction = fract(point);
    fraction = fraction * fraction * (3.0 - 2.0 * fraction);

    float a = hash21(index);
    float b = hash21(index + vec2(1.0, 0.0));
    float c = hash21(index + vec2(0.0, 1.0));
    float d = hash21(index + vec2(1.0, 1.0));
    return mix(mix(a, b, fraction.x), mix(c, d, fraction.x), fraction.y);
  }

  float fbm(vec2 point) {
    float value = 0.0;
    float amplitude = 0.55;
    mat2 octaveRotation = mat2(0.80, -0.60, 0.60, 0.80);

    for (int octave = 0; octave < 4; octave += 1) {
      value += valueNoise(point) * amplitude;
      point = octaveRotation * point * 2.03 + vec2(7.1, 3.7);
      amplitude *= 0.48;
    }

    return value;
  }

  mat2 rotate2d(float angle) {
    float sine = sin(angle);
    float cosine = cos(angle);
    return mat2(cosine, sine, -sine, cosine);
  }

  float softPatch(
    vec2 point,
    vec2 center,
    float angle,
    float halfLength,
    float halfWidth,
    float bend,
    float variation
  ) {
    vec2 local = rotate2d(angle) * (point - center);
    local.y += sin(local.x * 2.35 + variation) * bend;
    local.y += sin(local.x * 5.1 - variation * 0.7) * bend * 0.28;

    float changingWidth = halfWidth * (
      0.82
      + 0.18 * sin(local.x * 4.4 + variation)
      + 0.12 * sin(local.x * 8.7 - variation * 1.6)
    );
    float crossSection = exp(-2.35 * pow(abs(local.y) / max(changingWidth, 0.001), 2.0));
    float lengthMask = 1.0 - smoothstep(halfLength * 0.48, halfLength, abs(local.x));
    return crossSection * lengthMask;
  }

  void main() {
    float time = uTime;
    vec2 point = (vUv - 0.5) * vec2(uAspect, 1.0);

    // Two low-frequency fields gently bend the projected light without a visible loop.
    float primaryNoise = fbm(point * 1.18 + vec2(time * 0.017, -time * 0.011));
    float secondaryNoise = fbm(point * 2.05 + vec2(-time * 0.009, time * 0.014) + 8.7);
    vec2 warpedPoint = point + vec2(primaryNoise - 0.5, secondaryNoise - 0.5) * vec2(0.18, 0.105);

    float driftA = sin(time * 0.071) * 0.032 + sin(time * 0.029 + 1.7) * 0.018;
    float driftB = cos(time * 0.053 + 0.8) * 0.026 + sin(time * 0.021) * 0.016;
    float diagonalAngle = -0.66;

    float light = 0.0;
    light += softPatch(
      warpedPoint,
      vec2(-0.42 + driftA, 0.08 + driftB),
      diagonalAngle,
      0.58,
      0.105,
      0.045 + (primaryNoise - 0.5) * 0.035,
      0.7 + time * 0.025
    ) * 0.56;
    light += softPatch(
      warpedPoint,
      vec2(0.05 - driftB, 0.18 - driftA * 0.55),
      diagonalAngle - 0.08,
      0.72,
      0.125,
      0.052 + (secondaryNoise - 0.5) * 0.042,
      2.4 - time * 0.019
    ) * 0.74;
    light += softPatch(
      warpedPoint,
      vec2(0.46 + driftA * 0.62, -0.04 + driftB * 0.8),
      diagonalAngle + 0.07,
      0.66,
      0.112,
      0.044 + (primaryNoise - 0.5) * 0.038,
      4.8 + time * 0.017
    ) * 0.62;
    light += softPatch(
      warpedPoint,
      vec2(0.69 - driftB * 0.8, 0.34 + driftA * 0.45),
      diagonalAngle - 0.13,
      0.39,
      0.082,
      0.034 + (secondaryNoise - 0.5) * 0.03,
      7.1 - time * 0.021
    ) * 0.43;
    light += softPatch(
      warpedPoint,
      vec2(0.14 + driftB, -0.43 - driftA * 0.5),
      diagonalAngle + 0.04,
      0.58,
      0.13,
      0.05 + (primaryNoise - 0.5) * 0.04,
      9.0 + time * 0.014
    ) * 0.52;

    // A broad, faint illumination field connects the streaks without whitening the page.
    float ambient = smoothstep(0.62, 0.86, primaryNoise) * 0.045;
    float breathing = 0.94
      + sin(time * 0.083 + primaryNoise * 2.8) * 0.045
      + sin(time * 0.037 + 2.2) * 0.025;
    light = clamp((light + ambient) * breathing, 0.0, 0.88);

    vec3 sky = vec3(0.902, 0.953, 0.988);
    vec3 secondScreen = vec3(0.952941, 0.980392, 1.0);
    vec3 ivory = vec3(0.985, 0.994, 1.0);
    vec3 background = mix(sky, secondScreen, clamp(uBackgroundMix, 0.0, 1.0));
    float causticStrength = mix(1.0, 0.08, clamp(uBackgroundMix, 0.0, 1.0));
    vec3 color = mix(background, ivory, smoothstep(0.16, 0.78, light) * 0.82 * causticStrength);

    gl_FragColor = vec4(color, 1.0);
  }
`
