lucide.createIcons();

const dropZone = document.getElementById('dropZone');
const fileInput = document.getElementById('fileInput');
const canvasWrapper = document.getElementById('canvasWrapper');
const threeContainer = document.getElementById('threeContainer');
const exportBtn = document.getElementById('exportBtn');
const resetViewBtn = document.getElementById('resetViewBtn');
const iriRange = document.getElementById('iriRange');
const roughRange = document.getElementById('roughRange');
const iriVal = document.getElementById('iriVal');
const roughVal = document.getElementById('roughVal');
const hintBadge = document.getElementById('hintBadge');

let scene, camera, renderer, stickerMesh, material, light, pointLight;

let isDragging = false;
let isPanning = false;
let previousMousePosition = { x: 0, y: 0 };

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
  camera = new THREE.PerspectiveCamera(45, 1, 0.1, 1000);
  camera.position.set(0, 0, 5.5);

  renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, preserveDrawingBuffer: true });
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

function resetView() {
  if (camera) {
    camera.position.set(0, 0, 5.5);
  }
  if (stickerMesh) {
    stickerMesh.rotation.set(0, 0, 0);
  }
}

resetViewBtn.addEventListener('click', (e) => {
  e.stopPropagation();
  resetView();
});

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
      const maxScale = 2.2; 
      
      if (aspect > 1) {
        stickerMesh.scale.set(maxScale, maxScale / aspect, 1);
      } else {
        stickerMesh.scale.set(maxScale * aspect, maxScale, 1);
      }

      resetView();

      dropZone.classList.add('hidden');
      canvasWrapper.classList.remove('hidden');
      
      camera.aspect = threeContainer.clientWidth / threeContainer.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(threeContainer.clientWidth, threeContainer.clientHeight);

      exportBtn.disabled = false;
      
      setTimeout(() => {
        hintBadge.style.opacity = '1';
        setTimeout(() => {
          hintBadge.style.opacity = '0';
        }, 5000);
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
    document.querySelectorAll('.finish-btn').forEach(b => b.className = "finish-btn inactive-btn");
    btn.className = "finish-btn active-btn";

    const preset = finishes[btn.dataset.finish];
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
    document.querySelectorAll('.bg-btn').forEach(b => b.className = "bg-btn inactive-btn");
    btn.className = "bg-btn active-btn";

    if (btn.dataset.bg === 'grid') {
      threeContainer.className = "w-full h-full bg-grid-pattern rounded-2xl overflow-hidden";
    } else {
      threeContainer.className = "w-full h-full bg-pure-black rounded-2xl overflow-hidden";
    }
  });
});

canvasWrapper.addEventListener('contextmenu', (e) => e.preventDefault());

canvasWrapper.addEventListener('mousedown', (e) => {
  if (e.button === 0) isDragging = true;
  if (e.button === 2) isPanning = true;
  previousMousePosition = { x: e.clientX, y: e.clientY };
});

window.addEventListener('mouseup', () => {
  isDragging = false;
  isPanning = false;
});

window.addEventListener('mousemove', (e) => {
  if (!isDragging && !isPanning) return;
  
  const deltaMove = {
    x: e.clientX - previousMousePosition.x,
    y: e.clientY - previousMousePosition.y
  };

  if (isDragging && stickerMesh) {
    stickerMesh.rotation.y += deltaMove.x * 0.01;
    stickerMesh.rotation.x += deltaMove.y * 0.01;
  }

  if (isPanning && camera) {
    const panSpeed = (camera.position.z / 5.5) * 0.01;
    camera.position.x -= deltaMove.x * panSpeed;
    camera.position.y += deltaMove.y * panSpeed;
  }

  previousMousePosition = { x: e.clientX, y: e.clientY };
});

canvasWrapper.addEventListener('touchstart', (e) => {
  if (e.touches.length === 1) {
    isDragging = true;
    previousMousePosition = { x: e.touches[0].clientX, y: e.touches[0].clientY };
  }
}, { passive: false });

window.addEventListener('touchend', () => {
  isDragging = false;
});

window.addEventListener('touchmove', (e) => {
  if (!isDragging || e.touches.length !== 1) return;
  const deltaMove = {
    x: e.touches[0].clientX - previousMousePosition.x,
    y: e.touches[0].clientY - previousMousePosition.y
  };
  
  if (stickerMesh) {
    stickerMesh.rotation.y += deltaMove.x * 0.01;
    stickerMesh.rotation.x += deltaMove.y * 0.01;
  }
  
  previousMousePosition = { x: e.touches[0].clientX, y: e.touches[0].clientY };
}, { passive: false });

canvasWrapper.addEventListener('wheel', (e) => {
  if (canvasWrapper.classList.contains('hidden')) return;
  e.preventDefault();
  camera.position.z += e.deltaY * 0.005;
  camera.position.z = Math.max(2, Math.min(camera.position.z, 12));
}, { passive: false });

function animate() {
  requestAnimationFrame(animate);
  if (renderer && scene && camera) {
    renderer.render(scene, camera);
  }
}

exportBtn.addEventListener('click', () => {
  const originalHTML = exportBtn.innerHTML;
  exportBtn.innerHTML = `<i data-lucide="loader-2" class="w-4 h-4 animate-spin"></i> Processing HD...`;
  exportBtn.disabled = true;
  exportBtn.style.cursor = 'wait';
  lucide.createIcons();

  setTimeout(() => {
    renderer.render(scene, camera);
    
    renderer.domElement.toBlob((blob) => {
      if (blob) {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'holosticker-3d-mockup.png';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        
        setTimeout(() => URL.revokeObjectURL(url), 1000);
      } else {
        alert("Failed to export. The image might be too large.");
      }
      
      exportBtn.innerHTML = originalHTML;
      exportBtn.disabled = false;
      exportBtn.style.cursor = 'pointer';
      lucide.createIcons(); 
      
    }, 'image/png');
  }, 100); 
});

window.addEventListener('resize', () => {
  if (!renderer || !camera || !threeContainer || canvasWrapper.classList.contains('hidden')) return;
  camera.aspect = threeContainer.clientWidth / threeContainer.clientHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(threeContainer.clientWidth, threeContainer.clientHeight);
});