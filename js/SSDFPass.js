/**
 * @author João Cardoso / jaliborc.com
 */

 THREE.SSDFPass = function(scene, camera, width, height) {
 	THREE.ShaderPass.call(this, THREE.ShaderLib.ssdfPass)

  var depthTexture = new THREE.DepthTexture()
	depthTexture.type = THREE.UnsignedShortType
	depthTexture.minFilter = THREE.NearestFilter
	depthTexture.maxFilter = THREE.NearestFilter

  this.maskPass = new THREE.MaterialMaskPass(scene, camera)
	this.maskRenderTarget = new THREE.WebGLRenderTarget(width, height, {
		minFilter: THREE.LinearFilter,
		magFilter: THREE.LinearFilter,
		format: THREE.RGBAFormat,
		depthTexture: depthTexture,
		depthBuffer: true
	})

  this.material.uniforms.tMaterial.value = this.maskRenderTarget.texture
  this.material.uniforms.tDepth.value = this.maskRenderTarget.depthTexture
}

THREE.SSDFPass.prototype = Object.assign(Object.create(THREE.ShaderPass.prototype), {
  render: function(renderer, writeBuffer) {
    this.maskPass.render(renderer, this.maskRenderTarget)
    this.material.uniforms['materialScale'].value = this.maskPass.scale
    this.material.uniforms['originMaterial'].value = this.origin ? this.origin.id / this.maskPass.scale : -1
    this.material.uniforms['targetMaterial'].value = this.target ? this.target.id / this.maskPass.scale : -1
    this.material.uniforms['projection'].value = this.maskPass.camera.projectionMatrix
    this.material.uniforms['invProjection'].value.getInverse(this.maskPass.camera.projectionMatrix)

    THREE.ShaderPass.prototype.render.call(this, renderer, writeBuffer)
  },

  setSize: function(width, height) {
		this.maskRenderTarget.setSize(width, height)
  }
})

THREE.ShaderLib.ssdfPass = {
  defines: {
    'MAX_DISTANCE': 15.0,
    'NUM_DIRECTIONS': 16,
    'NUM_SAMPLES': 32,
    'RANDOMNESS': 0.5,
  },

  uniforms: {
    'tMaterial': { value: null },
    'tDepth': { value: null },
    'projection': { value: new THREE.Matrix4() },
    'invProjection': { value: new THREE.Matrix4() },
    'materialScale': { value: 1.0 },
    'originMaterial': { value: -1 },
    'targetMaterial': { value: -1 },
  },

	vertexShader: [
    'varying vec2 vUv;',
		'void main() {',
  		'	vUv = uv;',
  		'	gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);',
		'}'
	].join('\n'),

	fragmentShader: [
		'uniform sampler2D tMaterial, tDepth;',
    'uniform mat4 projection, invProjection;',
    'uniform float materialScale, originMaterial, targetMaterial;',
    'varying vec2 vUv;',

    'const float directionStep = 6.28318530718 / float(NUM_DIRECTIONS);',

    'bool IsMaterial(float material, vec2 coord) {',
      'return abs(texture2D(tMaterial, coord).r - material) < (0.95 / materialScale);',
    '}',

    'bool IsTarget(vec2 coord) {',
      'if (targetMaterial == -1.0)',
        'return !IsMaterial(originMaterial, coord);',
      'else',
        'return IsMaterial(targetMaterial, coord);',
    '}',

    'vec2 Project(vec3 pos) {',
      'vec4 coord = projection * vec4(pos, 1.0);',
      'coord.xy = coord.xy / coord.w / 2.0 + 0.5;',
      'coord.y = 1.0 - coord.y;',

      'return coord.xy;',
    '}',

    'vec3 Unproject(vec2 coord) {',
      'float z = texture2D(tDepth, coord).r;',
      'vec4 pos = vec4(coord.x * 2.0 - 1.0, (1.0 - coord.y) * 2.0 - 1.0, z, 1.0);',
      'pos = invProjection * pos;',

      'return pos.xyz / pos.w;',
    '}',

    'float Rand(vec2 v) {',
        'float a = 12.9898;',
        'float b = 78.233;',
        'float c = 43758.5453;',
        'float dt = dot(v.xy ,vec2(a,b));',
        'float sn = mod(dt,3.14);',
        'return fract(sin(sn) * c);',
    '}',

    'vec2 RotateDirection(vec2 dir, float angle) {',
      'float x = cos(angle); float y = sin(angle);',
      'return vec2(dir.x*x - dir.y*y, dir.x*y + dir.y*x);',
    '}',

    'vec2 RotateRand(vec2 dir, vec2 coord) {',
    	'float angle = (Rand(coord) - 0.5) * float(RANDOMNESS);',
    	'return RotateDirection(dir, angle);',
    '}',

    'float TraceDistance(vec3 pos, vec2 x, vec2 dx) {',
    	'if (IsTarget(x)) {',
    	 'bool last = true;',
    	 'vec2 best = x;',

    		'for (int i = 0; i < NUM_SAMPLES; i++) {',
    			'dx /= 2.0;',
    			'x += dx;',

    			'bool now = IsTarget(x);',,
    			'if (now)',,
    				'best = x;',
    			'if ((int(last) - int(now)) != 0)',
    				'dx *= -1.0;',

    			'last = now;',
    			'dx = RotateRand(dx, x);',
    		'}',

    		'return length(pos - Unproject(best)) / float(MAX_DISTANCE);',
    	'}',

      'return 1.0;',
    '}',

    'void main() {',
      'if (IsMaterial(originMaterial, vUv)) {',
        'vec3 pos = Unproject(vUv);',
        'vec2 calibration = Project(pos + vec3(1.0, 0.0, 0.0) * float(MAX_DISTANCE));',
        'vec2 dx = calibration - vUv;',

        'float v = TraceDistance(pos, vUv + dx, -dx);',
        'for (int i = 1; i < NUM_DIRECTIONS; i++) {',
          'vec2 di = RotateDirection(dx, directionStep * float(i));',
          'v = min(v, TraceDistance(pos, vUv + di, -di));',
        '}',

        'gl_FragColor = vec4(v);',
      '} else {',
        'gl_FragColor = vec4(0.0);',
      '}',
    '}'
	].join('\n')
}
