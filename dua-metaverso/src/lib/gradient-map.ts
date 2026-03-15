import * as THREE from 'three'

/* ─── 5-step cel-shading gradient map ─── 
   Produces a rich, cinematic toon look with:
   deep shadow → shadow → mid-tone → highlight → specular peak
*/

let sharedGradientMap: THREE.DataTexture | null = null

export function getGradientMap(): THREE.DataTexture {
  if (sharedGradientMap) return sharedGradientMap

  const data = new Uint8Array([
    20,  20,  25,  255,   // deep shadow (near-black with cool tint)
    55,  55,  60,  255,   // shadow
    140, 140, 150, 255,   // mid-tone
    215, 215, 225, 255,   // highlight
    255, 255, 255, 255,   // specular peak
  ])

  const texture = new THREE.DataTexture(data, 5, 1, THREE.RGBAFormat)
  texture.magFilter = THREE.NearestFilter
  texture.minFilter = THREE.NearestFilter
  texture.needsUpdate = true

  sharedGradientMap = texture
  return texture
}

/* ─── Premium 3-step gradient (for LOW tier fallback) ─── */
let sharedSimpleMap: THREE.DataTexture | null = null

export function getSimpleGradientMap(): THREE.DataTexture {
  if (sharedSimpleMap) return sharedSimpleMap

  const data = new Uint8Array([
    40,  40,  40,  255,
    160, 160, 160, 255,
    255, 255, 255, 255,
  ])

  const texture = new THREE.DataTexture(data, 3, 1, THREE.RGBAFormat)
  texture.magFilter = THREE.NearestFilter
  texture.minFilter = THREE.NearestFilter
  texture.needsUpdate = true

  sharedSimpleMap = texture
  return texture
}
