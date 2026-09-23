lucide.createIcons();

const dropZone = document.getElementById('dropZone');
const fileInput = document.getElementById('fileInput');
const canvasWrapper = document.getElementById('canvasWrapper');
const threeContainer = document.getElementById('threeContainer');
const exportBtn = document.getElementById('exportBtn');
const iriRange = document.getElementById('iriRange');
const roughRange = document.getElementById('roughRange');
const iriVal = document.getElementById('iriVal');
const roughVal = document.getElementById('roughVal');
const hintBadge = document.getElementById('hintBadge');

let scene, camera, renderer, stickerMesh, material, light, pointLight;
let targetRotationX = 0, targetRotationY = 0;

initThree();

dropZone.addEventListener('click', () => fileInput.click());
dropZone.addEventListener('dragover', (e) => { 
  e.preventDefault(); 
  dropZone.style.borderColor = 'rgba(255,255,255,0.4)'; 
});
dropZone.addEventListener('dragleave', () => { 
  dropZone.style.borderColor = ''; 
});
dropZone.addEventListener('drop', (e) => {
  e.preventDefault();
  dropZone.style.borderColor = '';
  if (e.dataTransfer.files.length) handleFile(e.dataTransfer.files[0]);
});
fileInput.addEventListener('change', (e) => { 
  if (e.target.files.length) handleFile(e.target.files[0]); 
});

function initThree() {
  scene = new THREE.Scene();
  // Using default values for now, will be resized on upload
  camera = new THREE.PerspectiveCamera(45, 1, 0.1, 1000);
  camera.position.z = 5;

  renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, preserveDrawingBuffer: true });
  // Set a tiny initial size, it gets fixed when the wrapper shows
  renderer.setSize(1, 1); 
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  threeContainer.appendChild(renderer.domElement);

  const ambientLight = new THREE.AmbientLight(0xffffff, 1.0);
  scene.add(ambientLight);

  light = new THREE.DirectionalLight(0xffffff, 2.0);
  light.position.set(2, 3, 4);
  scene.add(light);

  pointLight = new THREE.PointLight(0xffffff, 3, 10);
  pointLight.position.set(0, 0, 3);
  scene.add(pointLight);

  material = new THREE.MeshPhysicalMaterial({
    transparent: true,
    side: THREE.DoubleSide,
    roughness: 0.15,
    metalness: 0.8,
    clearcoat: 1.0,
    clearcoatRoughness: 0.1,
    iridescence: 1.0,
    iridescenceIOR: 1.3,
    iridescenceThicknessRange: [100, 400],
    alphaTest: 0.01 
  });

  const geometry = new THREE.PlaneGeometry(3, 3);
  stickerMesh = new THREE.Mesh(geometry, material);
  scene.add(stickerMesh);

  animate();
}

function handleFile(file) {
  const validTypes = ['image/png', 'image/webp', 'image/jpeg', 'image/svg+xml'];
  if (!validTypes.includes(file.type)) {
    alert("Please upload a valid image file (PNG, JPG, WEBP, or SVG).");
    return;
  }
  
  const reader = new FileReader();
  reader.onload = (e) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);
      
      const texture = new THREE.CanvasTexture(canvas);
      texture.colorSpace = THREE.SRGBColorSpace;
      
      material.map = texture;
      material.needsUpdate = true;

      const aspect = img.width / img.height;
      if (aspect > 1) {
        stickerMesh.scale.set(2.8, 2.8 / aspect, 1);
      } else {
        stickerMesh.scale.set(2.8 * aspect, 2.8, 1);
      }

      // Show the wrapper
      dropZone.classList.add('hidden');
      canvasWrapper.classList.remove('hidden');
      
      // CRITICAL FIX: Resize the renderer and camera now that the container has physical dimensions
      camera.aspect = threeContainer.clientWidth / threeContainer.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(threeContainer.clientWidth, threeContainer.clientHeight);

      exportBtn.disabled = false;
      
      setTimeout(() => {
        hintBadge.style.opacity = '1';
        setTimeout(() => {
          hintBadge.style.opacity = '0';
        }, 3000);
      }, 500);
    };
    img.src = e.target.result;
  };
  reader.readAsDataURL(file);
}

const finishes = {
  holo: { iridescence: 1.0, iridescenceIOR: 1.3, roughness: 0.15, metalness: 0.8, clearcoat: 1.0 },
  gloss: { iridescence: 0.0, iridescenceIOR: 1.0, roughness: 0.05, metalness: 0.1, clearcoat: 1.0 },
  matte: { iridescence: 0.0, iridescenceIOR: 1.0, roughness: 0.85, metalness: 0.0, clearcoat: 0.0 },
  glitter: { iridescence: 0.6, iridescenceIOR: 1.6, roughness: 0.4, metalness: 0.9, clearcoat: 0.8 }
};

document.querySelectorAll('.finish-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.finish-btn').forEach(b => {
      b.className = "finish-btn inactive-btn";
    });
    btn.className = "finish-btn active-btn";

    const finishKey = btn.dataset.finish;
    const preset = finishes[finishKey];
    
    material.iridescence = preset.iridescence;
    material.iridescenceIOR = preset.iridescenceIOR;
    material.roughness = preset.roughness;
    material.metalness = preset.metalness;
    material.clearcoat = preset.clearcoat;
    material.needsUpdate = true;

    iriRange.value = preset.iridescence;
    roughRange.value = preset.roughness;
    iriVal.textContent = preset.iridescence.toFixed(2);
    roughVal.textContent = preset.roughness.toFixed(2);
  });
});

iriRange.addEventListener('input', () => {
  material.iridescence = parseFloat(iriRange.value);
  iriVal.textContent = parseFloat(iriRange.value).toFixed(2);
});

roughRange.addEventListener('input', () => {
  material.roughness = parseFloat(roughRange.value);
  roughVal.textContent = parseFloat(roughRange.value).toFixed(2);
});

document.querySelectorAll('.bg-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.bg-btn').forEach(b => {
      b.className = "bg-btn inactive-btn";
    });
    btn.className = "bg-btn active-btn";

    const bg = btn.dataset.bg;
    if (bg === 'grid') {
      threeContainer.className = "w-full h-full bg-grid-pattern rounded-2xl overflow-hidden";
    } else {
      threeContainer.className = "w-full h-full bg-pure-black rounded-2xl overflow-hidden";
    }
  });
});

window.addEventListener('mousemove', (e) => {
  if (!canvasWrapper || canvasWrapper.classList.contains('hidden')) return;
  const rect = canvasWrapper.getBoundingClientRect();
  const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
  const y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

  targetRotationY = x * 0.4;
  targetRotationX = -y * 0.4;

  if (pointLight) {
    pointLight.position.x = x * 3;
    pointLight.position.y = y * 3;
  }
});

function animate() {
  requestAnimationFrame(animate);
  if (stickerMesh) {
    stickerMesh.rotation.y += (targetRotationY - stickerMesh.rotation.y) * 0.08;
    stickerMesh.rotation.x += (targetRotationX - stickerMesh.rotation.x) * 0.08;
  }
  if (renderer && scene && camera) {
    renderer.render(scene, camera);
  }
}

exportBtn.addEventListener('click', () => {
  renderer.render(scene, camera);
  const dataURL = renderer.domElement.toDataURL('image/png');
  const a = document.createElement('a');
  a.href = dataURL;
  a.download = 'holosticker-3d-mockup.png';
  a.click();
});

window.addEventListener('resize', () => {
  if (!renderer || !camera || !threeContainer || canvasWrapper.classList.contains('hidden')) return;
  camera.aspect = threeContainer.clientWidth / threeContainer.clientHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(threeContainer.clientWidth, threeContainer.clientHeight);
});