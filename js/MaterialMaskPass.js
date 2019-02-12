/**
 * @author João Cardoso / jaliborc.com
 */

THREE.MaterialMaskPass = function(scene, camera) {
	THREE.Pass.call( this )

	this.camera = camera
	this.scene = scene
	this.clear = true
}

THREE.MaterialMaskPass.prototype = Object.assign(Object.create(THREE.Pass.prototype), {
	render: function(renderer, writeBuffer) {
		var color = renderer.getClearColor()
		var cache = {}
		var scale = 0

    this.scene.traverse(function(object) {
      if (object instanceof THREE.Mesh)
      scale = Math.max(scale, object.material.id)
    })

		this.scale = scale
		this.scene.traverse(function(object) {
			if (object instanceof THREE.Mesh) {
        var target = object.material
        cache[object.id] = target

				object.material = new THREE.ShaderMaterial(THREE.ShaderLib.materialMaskPass)
        object.material.uniforms = { id: { value: target.id / scale } }
			}
		})

		renderer.setClearColor(0)
		if (this.renderToScreen)
			renderer.render(this.scene, this.camera)
		else
			renderer.render(this.scene, this.camera, writeBuffer, this.clear)
		renderer.setClearColor(color)

		this.scene.traverse(function(object) {
			if (object instanceof THREE.Mesh)
				object.material = cache[object.id]
		})
	}
})

THREE.ShaderLib.materialMaskPass = {
	uniforms: {
		id: { value: 0 }
	},

	vertexShader: [
		'void main() {',
			'gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);',
		'}'
	].join('\n'),

	fragmentShader: [
		'uniform float id;',
		'void main() {',
			'gl_FragColor = vec4(id);',
		'}'
	].join('\n')
}
