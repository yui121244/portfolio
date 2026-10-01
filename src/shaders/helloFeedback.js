export const feedbackVertexShader = /* glsl */ `
  varying vec2 vUv;

  void main() {
    vUv = uv;
    gl_Position = vec4(position.xy, 0.0, 1.0);
  }
`

export const feedbackFragmentShader = /* glsl */ `
  precision highp float;

  uniform sampler2D uCurrentFrame;
  uniform sampler2D uPreviousFrame;
  uniform vec2 uPointerUv;
  uniform vec2 uPreviousPointerUv;
  uniform float uStrength;
  uniform float uDecay;
  uniform float uAspect;

  varying vec2 vUv;

  vec2 toAspectSpace(vec2 uv) {
    return vec2(uv.x * uAspect, uv.y);
  }

  float distanceToSegment(vec2 point, vec2 start, vec2 end) {
    vec2 segment = end - start;
    float segmentLengthSq = max(dot(segment, segment), 0.000001);
    float along = clamp(dot(point - start, segment) / segmentLengthSq, 0.0, 1.0);
    return length(point - (start + segment * along));
  }

  void main() {
    vec2 start = toAspectSpace(uPreviousPointerUv);
    vec2 end = toAspectSpace(uPointerUv);
    vec2 travel = end - start;
    float distanceMoved = length(travel);
    float distanceToStroke = distanceToSegment(toAspectSpace(vUv), start, end);

    // A broad, smooth brush carries the body AND both glass rims together.
    float brush = 1.0 - smoothstep(0.0, 0.15, distanceToStroke);
    float glassContact = 0.0;
    for (int i = 0; i < 5; i++) {
      vec2 probe = mix(uPreviousPointerUv, uPointerUv, float(i) * 0.25);
      vec2 oldOffset = texture2D(uPreviousFrame, probe).rg / vec2(uAspect, 1.0);
      glassContact = max(glassContact, texture2D(uCurrentFrame, clamp(probe - oldOffset, 0.0, 1.0)).a);
    }

    // Store signed displacement, never colored pixels. Input is pointer
    // distance rather than a per-frame minimum, so slow motion is gentle.
    vec2 impulse = travel * min(1.0, 0.045 / max(distanceMoved, 0.000001));
    impulse *= brush * uStrength * glassContact;
    // Keep the return field anchored rather than recursively dragging its
    // boundary: advection steepens it into pinches on fast repeated sweeps.
    vec2 displacement = texture2D(uPreviousFrame, vUv).rg * uDecay + impulse;
    float magnitude = length(displacement);
    float limited = 0.06 + 0.025 * (1.0 - exp(-max(magnitude - 0.06, 0.0) / 0.025));
    displacement *= min(1.0, limited / max(magnitude, 0.000001));
    if (length(displacement) < 0.00001) displacement = vec2(0.0);
    gl_FragColor = vec4(displacement, 0.0, 1.0);
  }
`

export const ghostFragmentShader = /* glsl */ `
  precision highp float;

  uniform sampler2D uCurrentFrame;
  uniform sampler2D uDisplacement;
  uniform float uAspect;
  varying vec2 vUv;

  void main() {
    vec2 displacement = texture2D(uDisplacement, vUv).rg / vec2(uAspect, 1.0);
    vec2 sourceUv = vUv - displacement;
    if (any(lessThan(sourceUv, vec2(0.0))) || any(greaterThan(sourceUv, vec2(1.0)))) discard;

    // One continuous sample of the original glass. Opacity, tint, refraction,
    // dispersion and specular travel together; no additive outlines or colors.
    vec4 glass = texture2D(uCurrentFrame, sourceUv);
    if (glass.a < 0.001) discard;
    gl_FragColor = glass;
  }
`
