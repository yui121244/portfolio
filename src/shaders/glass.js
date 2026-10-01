export const glassVertexShader = /* glsl */ `
  uniform float uThicknessScale;
  uniform vec2 uLocalYBounds;
  varying vec3 vWorldPosition;
  varying vec3 vWorldNormal;
  varying vec3 vViewNormal;
  varying vec3 vLocalPosition;
  varying float vLocalY;

  void main() {
    vec3 transformed = position;
    transformed.z *= uThicknessScale;

    vec3 adjustedNormal = normal;
    adjustedNormal.z /= max(uThicknessScale, 0.001);
    adjustedNormal = normalize(adjustedNormal);

    vec4 worldPosition = modelMatrix * vec4(transformed, 1.0);
    vWorldPosition = worldPosition.xyz;
    vWorldNormal = normalize(mat3(modelMatrix) * adjustedNormal);
    vViewNormal = normalize(normalMatrix * adjustedNormal);
    vLocalPosition = transformed;
    vLocalY = clamp(
      (position.y - uLocalYBounds.x) / max(uLocalYBounds.y - uLocalYBounds.x, 0.001),
      0.0,
      1.0
    );

    gl_Position = projectionMatrix * viewMatrix * worldPosition;
  }
`

export const glassFragmentShader = /* glsl */ `
  precision highp float;

  uniform sampler2D uSceneTexture;
  uniform vec2 uResolution;
  uniform vec3 uLightPosition;
  uniform float uTime;
  uniform float uEntranceProgress;
  uniform float uEntranceActive;
  uniform float uRefraction;
  uniform float uDispersion;
  uniform float uOpticalThickness;
  uniform float uDistortion;
  uniform vec2 uPointerUv;
  uniform vec2 uPointerVelocity;
  uniform float uDragStrength;
  uniform float uAspect;
  uniform vec3 uTintLow;
  uniform vec3 uTintHigh;

  varying vec3 vWorldPosition;
  varying vec3 vWorldNormal;
  varying vec3 vViewNormal;
  varying vec3 vLocalPosition;
  varying float vLocalY;

  float hash31(vec3 point) {
    point = fract(point * 0.1031);
    point += dot(point, point.yzx + 33.33);
    return fract((point.x + point.y) * point.z);
  }

  float smoothNoise(vec3 point) {
    vec3 index = floor(point);
    vec3 fraction = fract(point);
    fraction = fraction * fraction * (3.0 - 2.0 * fraction);
    return mix(
      mix(mix(hash31(index), hash31(index + vec3(1.0, 0.0, 0.0)), fraction.x),
          mix(hash31(index + vec3(0.0, 1.0, 0.0)), hash31(index + vec3(1.0, 1.0, 0.0)), fraction.x), fraction.y),
      mix(mix(hash31(index + vec3(0.0, 0.0, 1.0)), hash31(index + vec3(1.0, 0.0, 1.0)), fraction.x),
          mix(hash31(index + vec3(0.0, 1.0, 1.0)), hash31(index + vec3(1.0, 1.0, 1.0)), fraction.x), fraction.y),
      fraction.z
    );
  }

  float bayer4(vec2 point) {
    vec2 cell = mod(floor(point), 4.0);
    float x = cell.x;
    float y = cell.y;
    float value = 0.0;

    if (y < 1.0) {
      value = x < 1.0 ? 0.0 : x < 2.0 ? 8.0 : x < 3.0 ? 2.0 : 10.0;
    } else if (y < 2.0) {
      value = x < 1.0 ? 12.0 : x < 2.0 ? 4.0 : x < 3.0 ? 14.0 : 6.0;
    } else if (y < 3.0) {
      value = x < 1.0 ? 3.0 : x < 2.0 ? 11.0 : x < 3.0 ? 1.0 : 9.0;
    } else {
      value = x < 1.0 ? 15.0 : x < 2.0 ? 7.0 : x < 3.0 ? 13.0 : 5.0;
    }

    return (value + 0.5) / 16.0;
  }

  void main() {
    vec2 screenUv = gl_FragCoord.xy / max(uResolution, vec2(1.0));
    if (uEntranceActive > 0.5) {
      const float ditherCellSize = 9.0;
      vec2 ditherCell = gl_FragCoord.xy / ditherCellSize;
      vec2 pointInCell = fract(ditherCell) - 0.5;
      float orderedThreshold = bayer4(floor(ditherCell));
      float localReveal = clamp(
        uEntranceProgress * 1.35 - orderedThreshold * 0.42 + 0.08,
        0.0,
        1.0
      );
      float dotRadius = mix(0.035, 0.76, smoothstep(0.0, 1.0, localReveal));
      if (length(pointInCell) > dotRadius) discard;
    }

    vec3 normal = normalize(vWorldNormal);
    vec3 viewDirection = normalize(cameraPosition - vWorldPosition);
    float facing = clamp(abs(dot(normal, viewDirection)), 0.0, 1.0);
    float fresnel = pow(1.0 - facing, 3.1);

    float irregularity = smoothNoise(vLocalPosition * 0.045 + vec3(0.0, uTime * 0.08, 0.0));
    float thickness = uOpticalThickness * mix(0.72, 1.55, pow(1.0 - facing, 0.72));
    thickness *= mix(0.9, 1.12, irregularity);

    vec2 flow = vec2(
      sin(vLocalPosition.y * 0.055 + uTime * 0.44),
      cos(vLocalPosition.x * 0.037 - uTime * 0.36)
    ) * uDistortion;
    vec2 refractionVector = (normalize(vViewNormal).xy + flow) * uRefraction * thickness;

    float pointerVelocityLength = length(uPointerVelocity);
    vec2 aspectVelocity = vec2(uPointerVelocity.x * uAspect, uPointerVelocity.y);
    vec2 aspectDirection = pointerVelocityLength > 0.000001
      ? normalize(aspectVelocity)
      : vec2(0.0);
    vec2 pointerDelta = vec2(
      (screenUv.x - uPointerUv.x) * uAspect,
      screenUv.y - uPointerUv.y
    );
    float alongDirection = dot(pointerDelta, aspectDirection);
    float acrossDirection = length(
      pointerDelta - aspectDirection * alongDirection
    );
    float alongInfluence = 1.0 - smoothstep(0.075, 0.145, abs(alongDirection));
    float acrossInfluence = 1.0 - smoothstep(0.032, 0.062, acrossDirection);
    float pointerInfluence = alongInfluence * acrossInfluence;
    vec2 pointerDirection = vec2(
      aspectDirection.x / max(uAspect, 0.0001),
      aspectDirection.y
    );
    refractionVector += pointerDirection * uDragStrength * pointerInfluence * 0.032;

    float spread = uDispersion;
    float red = texture2D(uSceneTexture, clamp(screenUv + refractionVector * (1.0 + spread), 0.001, 0.999)).r;
    float green = texture2D(uSceneTexture, clamp(screenUv + refractionVector, 0.001, 0.999)).g;
    float blue = texture2D(uSceneTexture, clamp(screenUv + refractionVector * (1.0 - spread), 0.001, 0.999)).b;
    vec3 refracted = vec3(red, green, blue);

    vec3 tint = mix(uTintLow, uTintHigh, smoothstep(0.05, 0.95, vLocalY));
    vec3 transmittance = pow(max(tint, vec3(0.01)), vec3(thickness * 0.46));
    vec3 color = refracted * transmittance;
    float tintWeight = mix(0.25, 0.5, vLocalY) + fresnel * 0.12;
    color = mix(color, tint, clamp(tintWeight, 0.0, 0.68));
    color *= vec3(0.94, 0.985, 1.055);

    vec3 lightDirection = normalize(uLightPosition - vWorldPosition);
    vec3 halfDirection = normalize(lightDirection + viewDirection);
    float specular = pow(max(dot(normal, halfDirection), 0.0), 112.0);
    float ringHighlight = pow(max(dot(normal, lightDirection), 0.0), 3.2) * fresnel;
    float edge = smoothstep(0.08, 0.94, fresnel);

    color += vec3(0.95, 0.985, 1.0) * specular * 0.9;
    color += mix(vec3(0.14, 0.36, 0.9), vec3(1.0), ringHighlight) * ringHighlight * 0.58;
    color += vec3(0.18, 0.43, 0.96) * edge * 0.28;
    color += (irregularity - 0.5) * 0.026;

    float sparkleNoise = hash31(vec3(floor(gl_FragCoord.xy * 0.46), floor(uTime * 5.0)));
    float sparkle = smoothstep(0.987, 1.0, sparkleNoise) * (0.18 + edge * 0.82);
    color += vec3(0.98, 0.985, 1.0) * sparkle * 0.42;

    gl_FragColor = vec4(color, 1.0);
  }
`
