export const cursorGlassVertexShader = /* glsl */ `
  varying vec3 vWorldPosition;
  varying vec3 vWorldNormal;
  varying vec3 vViewNormal;
  varying vec3 vLocalPosition;

  void main() {
    vec4 worldPosition = modelMatrix * vec4(position, 1.0);
    vWorldPosition = worldPosition.xyz;
    vWorldNormal = normalize(mat3(modelMatrix) * normal);
    vViewNormal = normalize(normalMatrix * normal);
    vLocalPosition = position;
    gl_Position = projectionMatrix * viewMatrix * worldPosition;
  }
`

export const cursorGlassFragmentShader = /* glsl */ `
  precision highp float;

  uniform sampler2D uSceneTexture;
  uniform vec2 uResolution;
  uniform vec3 uBaseColor;
  uniform vec3 uRimColor;
  uniform vec3 uDeepColor;
  uniform vec3 uBackdropColor;
  uniform float uStandaloneBackdrop;
  uniform float uOpacity;
  uniform float uTime;
  uniform float uRefraction;
  uniform float uDispersion;

  varying vec3 vWorldPosition;
  varying vec3 vWorldNormal;
  varying vec3 vViewNormal;
  varying vec3 vLocalPosition;

  void main() {
    vec3 viewDirection = normalize(cameraPosition - vWorldPosition);
    vec3 normal = normalize(vWorldNormal);
    normal = dot(normal, viewDirection) < 0.0 ? -normal : normal;

    float facing = clamp(dot(normal, viewDirection), 0.0, 1.0);
    float fresnel = pow(1.0 - facing, 2.05);
    float sideThickness = smoothstep(0.1, 0.88, 1.0 - facing);
    float lowerThickness = 1.0 - smoothstep(-2.36, -0.68, vLocalPosition.y);
    float opticalThickness = 0.42 + sideThickness * 0.82 + lowerThickness * 0.12;

    vec2 screenUv = gl_FragCoord.xy / max(uResolution, vec2(1.0));
    vec2 flow = vec2(
      sin(vLocalPosition.y * 8.0 + uTime * 0.34),
      cos(vLocalPosition.x * 7.0 - uTime * 0.27)
    ) * 0.00018;
    vec2 refractionVector = (normalize(vViewNormal).xy * uRefraction + flow) * opticalThickness;
    float red = texture2D(uSceneTexture, clamp(screenUv + refractionVector * (1.0 + uDispersion), 0.001, 0.999)).r;
    float green = texture2D(uSceneTexture, clamp(screenUv + refractionVector, 0.001, 0.999)).g;
    float blue = texture2D(uSceneTexture, clamp(screenUv + refractionVector * (1.0 - uDispersion), 0.001, 0.999)).b;
    vec3 refracted = uStandaloneBackdrop > 0.5
      ? uBackdropColor
      : vec3(red, green, blue);

    // 85% transmitted ice-blue glass, 15% soft milky surface response.
    vec3 transmittance = mix(vec3(0.96, 0.98, 1.0), uBaseColor, 0.27 + opticalThickness * 0.08);
    vec3 color = refracted * transmittance;
    color = mix(color, uBaseColor, 0.30);

    float outerRim = smoothstep(0.006, 0.29, fresnel);
    float innerBevel = exp(-pow((fresnel - 0.052) / 0.041, 2.0));
    vec3 rimColor = mix(uRimColor, uDeepColor, sideThickness * 0.62 + lowerThickness * 0.24);
    color = mix(color, rimColor, outerRim * 0.88);

    // Soft studio key from upper-left and a very weak frontal fill.
    vec3 lightDirection = normalize(vec3(-0.5, 0.74, 0.46));
    vec3 halfDirection = normalize(lightDirection + viewDirection);
    float specular = pow(max(dot(normal, halfDirection), 0.0), 124.0);
    float keyFacing = pow(max(dot(normal, lightDirection), 0.0), 8.0);
    float highlightMask = 0.12 + innerBevel * 0.5 + outerRim * 0.38;
    color += vec3(0.88, 0.95, 1.0) * specular * highlightMask * 0.46;
    color += vec3(0.55, 0.87, 1.0) * innerBevel * keyFacing * 0.23;
    color += uBaseColor * facing * 0.035;

    // Keep headroom: only the thinnest highlight may approach white.
    color = min(color, vec3(0.965, 0.985, 1.0));
    gl_FragColor = vec4(color, uOpacity);
    #include <colorspace_fragment>
  }
`
