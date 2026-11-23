"use client";

import React, { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { Canvas, useFrame } from "@react-three/fiber";
import { ContactShadows, Environment, Float, Lightformer } from "@react-three/drei";

interface PointerRef {
  x: number;
  y: number;
}

/**
 * Mái vòm Kính mờ (MeshPhysicalMaterial transmission) gợi nhắc chữ U lật 180° thành N che chở thú cưng
 */
function ProtectiveGlassArch() {
  const archGeometry = useMemo(() => {
    const points: THREE.Vector3[] = [];
    // Trụ trái đi lên
    points.push(new THREE.Vector3(-1.42, -1.08, 0));
    points.push(new THREE.Vector3(-1.42, 0.15, 0));
    // Vòm tròn phía trên (180 độ mượt)
    const segments = 24;
    const radius = 1.42;
    for (let i = 0; i <= segments; i++) {
      const angle = Math.PI - (i / segments) * Math.PI;
      const x = Math.cos(angle) * radius;
      const y = 0.25 + Math.sin(angle) * radius;
      points.push(new THREE.Vector3(x, y, 0));
    }
    // Trụ phải đi xuống
    points.push(new THREE.Vector3(1.42, 0.15, 0));
    points.push(new THREE.Vector3(1.42, -1.08, 0));

    const curve = new THREE.CatmullRomCurve3(points);
    return new THREE.TubeGeometry(curve, 96, 0.23, 28, false);
  }, []);

  const innerHaloGeo = useMemo(() => {
    const points: THREE.Vector3[] = [];
    const segments = 20;
    const radius = 1.15;
    for (let i = 0; i <= segments; i++) {
      const angle = Math.PI - (i / segments) * Math.PI;
      points.push(
        new THREE.Vector3(Math.cos(angle) * radius, 0.22 + Math.sin(angle) * radius, -0.05)
      );
    }
    const curve = new THREE.CatmullRomCurve3(points);
    return new THREE.TubeGeometry(curve, 64, 0.032, 16, false);
  }, []);

  useEffect(() => {
    return () => {
      archGeometry.dispose();
      innerHaloGeo.dispose();
    };
  }, [archGeometry, innerHaloGeo]);

  return (
    <group position={[0, -0.04, -0.06]}>
      {/* Vòm kính mờ y khoa (Frosted Medical Glass) */}
      <mesh geometry={archGeometry} castShadow receiveShadow>
        <meshPhysicalMaterial
          color="#DCFCE7"
          transmission={0.78}
          opacity={1}
          transparent
          roughness={0.18}
          metalness={0.02}
          ior={1.45}
          thickness={1.45}
          attenuationColor="#0F766E"
          attenuationDistance={2.8}
          clearcoat={0.9}
          clearcoatRoughness={0.15}
        />
      </mesh>

      {/* Đường viền hào quang Xanh Ngọc nhẹ bên trong mái vòm */}
      <mesh geometry={innerHaloGeo}>
        <meshStandardMaterial
          color="#14B8A6"
          emissive="#0F766E"
          emissiveIntensity={0.65}
          roughness={0.35}
        />
      </mesh>

      {/* Đế tròn Soft Clay đỡ mái vòm */}
      <mesh position={[0, -1.16, 0]} receiveShadow>
        <cylinderGeometry args={[1.76, 1.88, 0.24, 64]} />
        <meshStandardMaterial
          color="#F3EFE6"
          roughness={0.82}
          metalness={0.02}
        />
      </mesh>
      {/* Viền chỉ Xanh Ngọc quanh chân đế */}
      <mesh position={[0, -1.04, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[1.74, 0.025, 16, 72]} />
        <meshStandardMaterial color="#0F766E" roughness={0.55} />
      </mesh>
    </group>
  );
}

/**
 * Chú thú cưng tối giản phong cách Soft Clay / Matte Silicone
 * Nằm gọn ấm áp dưới mái vòm kính mờ ANIMORA
 */
function SoftClayPet() {
  const petRef = useRef<THREE.Group>(null);
  const headRef = useRef<THREE.Group>(null);
  const tailRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    if (petRef.current) {
      // Nhịp thở nhẹ tự nhiên
      petRef.current.scale.y = 1 + Math.sin(t * 2.1) * 0.018;
      petRef.current.scale.x = 1 - Math.sin(t * 2.1) * 0.008;
    }
    if (headRef.current) {
      headRef.current.rotation.z = Math.sin(t * 1.15) * 0.055;
      headRef.current.rotation.x = Math.sin(t * 0.9) * 0.035;
    }
    if (tailRef.current) {
      tailRef.current.rotation.z = -0.55 + Math.sin(t * 3.8) * 0.22;
    }
  });

  const clayCream = "#FFF7EB";
  const clayPeach = "#F9D7C0";
  const clayTeal = "#0F766E";
  const clayCoral = "#F97316";
  const inkDark = "#132A2E";

  return (
    <group ref={petRef} position={[0, -0.52, 0.12]}>
      {/* Thân đất sét mềm tròn trịa */}
      <mesh position={[0, -0.02, 0]} scale={[1.04, 0.94, 0.98]} castShadow receiveShadow>
        <sphereGeometry args={[0.62, 48, 48]} />
        <meshStandardMaterial color={clayCream} roughness={0.78} metalness={0.0} />
      </mesh>

      {/* Bụng sáng mềm */}
      <mesh position={[0, -0.06, 0.34]} scale={[0.72, 0.68, 0.5]}>
        <sphereGeometry args={[0.52, 36, 36]} />
        <meshStandardMaterial color="#FFFFFF" roughness={0.85} />
      </mesh>

      {/* Vòng cổ y khoa Xanh Ngọc Matte Silicone */}
      <mesh position={[0, 0.42, 0.04]} rotation={[Math.PI / 2 + 0.14, 0, 0]} castShadow>
        <torusGeometry args={[0.45, 0.075, 24, 48]} />
        <meshStandardMaterial color={clayTeal} roughness={0.52} metalness={0.04} />
      </mesh>
      {/* Thẻ tròn Cam San Hô trên vòng cổ */}
      <mesh position={[0, 0.28, 0.51]} castShadow>
        <sphereGeometry args={[0.115, 28, 28]} />
        <meshStandardMaterial
          color={clayCoral}
          roughness={0.38}
          emissive="#F97316"
          emissiveIntensity={0.18}
        />
      </mesh>

      {/* Phần đầu tròn biểu cảm ấm áp */}
      <group ref={headRef} position={[0, 0.84, 0.08]}>
        <mesh scale={[1.08, 0.96, 0.96]} castShadow receiveShadow>
          <sphereGeometry args={[0.56, 48, 48]} />
          <meshStandardMaterial color={clayCream} roughness={0.76} />
        </mesh>

        {/* Đôi tai đất sét mềm cụp nhẹ thân thiện */}
        <group position={[-0.44, 0.34, -0.02]} rotation={[0.1, 0.15, 0.52]}>
          <mesh scale={[0.56, 1.05, 0.42]} castShadow>
            <sphereGeometry args={[0.34, 32, 32]} />
            <meshStandardMaterial color="#F3DFC8" roughness={0.82} />
          </mesh>
          <mesh position={[0.02, -0.04, 0.09]} scale={[0.34, 0.72, 0.22]}>
            <sphereGeometry args={[0.32, 24, 24]} />
            <meshStandardMaterial color={clayPeach} roughness={0.88} />
          </mesh>
        </group>

        <group position={[0.44, 0.34, -0.02]} rotation={[0.1, -0.15, -0.52]}>
          <mesh scale={[0.56, 1.05, 0.42]} castShadow>
            <sphereGeometry args={[0.34, 32, 32]} />
            <meshStandardMaterial color="#F3DFC8" roughness={0.82} />
          </mesh>
          <mesh position={[-0.02, -0.04, 0.09]} scale={[0.34, 0.72, 0.22]}>
            <sphereGeometry args={[0.32, 24, 24]} />
            <meshStandardMaterial color={clayPeach} roughness={0.88} />
          </mesh>
        </group>

        {/* Mõm nhỏ mềm */}
        <mesh position={[0, -0.11, 0.46]} scale={[1.25, 0.82, 0.85]}>
          <sphereGeometry args={[0.17, 32, 32]} />
          <meshStandardMaterial color="#FFFFFF" roughness={0.82} />
        </mesh>

        {/* Mũi nhỏ màu Xanh Than bóng mịn */}
        <mesh position={[0, -0.05, 0.59]} scale={[1.15, 0.82, 0.75]}>
          <sphereGeometry args={[0.068, 24, 24]} />
          <meshStandardMaterial color={inkDark} roughness={0.25} metalness={0.08} />
        </mesh>

        {/* Đôi mắt tròn đen láy + ánh sáng bắt mắt */}
        <group position={[-0.21, 0.05, 0.48]}>
          <mesh>
            <sphereGeometry args={[0.072, 24, 24]} />
            <meshStandardMaterial color={inkDark} roughness={0.14} metalness={0.12} />
          </mesh>
          <mesh position={[0.022, 0.024, 0.058]}>
            <sphereGeometry args={[0.02, 16, 16]} />
            <meshBasicMaterial color="#FFFFFF" />
          </mesh>
        </group>

        <group position={[0.21, 0.05, 0.48]}>
          <mesh>
            <sphereGeometry args={[0.072, 24, 24]} />
            <meshStandardMaterial color={inkDark} roughness={0.14} metalness={0.12} />
          </mesh>
          <mesh position={[0.022, 0.024, 0.058]}>
            <sphereGeometry args={[0.02, 16, 16]} />
            <meshBasicMaterial color="#FFFFFF" />
          </mesh>
        </group>

        {/* Đôi má ửng hồng cam ấm */}
        <mesh position={[-0.33, -0.09, 0.41]} scale={[1.25, 0.72, 0.4]}>
          <sphereGeometry args={[0.08, 20, 20]} />
          <meshStandardMaterial color="#FDBA74" roughness={0.9} transparent opacity={0.62} />
        </mesh>
        <mesh position={[0.33, -0.09, 0.41]} scale={[1.25, 0.72, 0.4]}>
          <sphereGeometry args={[0.08, 20, 20]} />
          <meshStandardMaterial color="#FDBA74" roughness={0.9} transparent opacity={0.62} />
        </mesh>
      </group>

      {/* Hai bàn chân trước gọn gàng */}
      <mesh position={[-0.3, -0.44, 0.42]} scale={[1, 0.68, 1.25]} castShadow>
        <sphereGeometry args={[0.17, 28, 28]} />
        <meshStandardMaterial color={clayCream} roughness={0.8} />
      </mesh>
      <mesh position={[0.3, -0.44, 0.42]} scale={[1, 0.68, 1.25]} castShadow>
        <sphereGeometry args={[0.17, 28, 28]} />
        <meshStandardMaterial color={clayCream} roughness={0.8} />
      </mesh>

      {/* Chiếc đuôi nhỏ vẫy vui */}
      <mesh
        ref={tailRef}
        position={[0.48, -0.18, -0.35]}
        rotation={[0.2, 0, -0.55]}
        castShadow
      >
        <capsuleGeometry args={[0.1, 0.34, 16, 24]} />
        <meshStandardMaterial color="#F3DFC8" roughness={0.8} />
      </mesh>
    </group>
  );
}

/**
 * Trái tim 3D nhịp đập Cam San Hô (#F97316) bay lơ lửng
 */
function FloatingMedicalHeart({ pointer }: { pointer: React.MutableRefObject<PointerRef> }) {
  const groupRef = useRef<THREE.Group>(null);

  const heartGeo = useMemo(() => {
    const shape = new THREE.Shape();
    const x = 0;
    const y = 0;
    shape.moveTo(x, y + 0.14);
    shape.bezierCurveTo(x, y + 0.32, x - 0.3, y + 0.32, x - 0.3, y + 0.08);
    shape.bezierCurveTo(x - 0.3, y - 0.14, x, y - 0.28, x, y - 0.42);
    shape.bezierCurveTo(x, y - 0.28, x + 0.3, y - 0.14, x + 0.3, y + 0.08);
    shape.bezierCurveTo(x + 0.3, y + 0.32, x, y + 0.32, x, y + 0.14);

    const geo = new THREE.ExtrudeGeometry(shape, {
      depth: 0.14,
      bevelEnabled: true,
      bevelSegments: 8,
      steps: 1,
      bevelSize: 0.06,
      bevelThickness: 0.06,
    });
    geo.center();
    return geo;
  }, []);

  useEffect(() => {
    return () => heartGeo.dispose();
  }, [heartGeo]);

  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    if (!groupRef.current) return;
    // Nhịp tim đập 2 nhịp nhẹ (lub-dub)
    const beat = 1 + Math.pow(Math.max(0, Math.sin(t * 3.1)), 6) * 0.16;
    groupRef.current.scale.setScalar(beat);

    // Parallax theo chuột với tốc độ riêng (0.55x)
    const targetX = 1.95 + pointer.current.x * 0.42;
    const targetY = 0.88 + pointer.current.y * 0.32;
    groupRef.current.position.x = THREE.MathUtils.lerp(groupRef.current.position.x, targetX, 0.06);
    groupRef.current.position.y = THREE.MathUtils.lerp(groupRef.current.position.y, targetY, 0.06);
    groupRef.current.rotation.y = Math.sin(t * 0.9) * 0.35 + pointer.current.x * 0.35;
  });

  return (
    <group ref={groupRef} position={[1.95, 0.88, 0.55]}>
      <Float speed={2.2} rotationIntensity={0.3} floatIntensity={0.45}>
        <mesh geometry={heartGeo} castShadow>
          <meshStandardMaterial
            color="#F97316"
            roughness={0.36}
            metalness={0.04}
            emissive="#F97316"
            emissiveIntensity={0.14}
          />
        </mesh>
      </Float>
    </group>
  );
}

/**
 * Dấu cộng Y tế & Lá chắn Kính mờ (#0F766E) bay lơ lửng bên trái trên
 */
function FloatingMedicalShield({ pointer }: { pointer: React.MutableRefObject<PointerRef> }) {
  const groupRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    if (!groupRef.current) return;
    // Parallax tốc độ khác (0.38x) tạo chiều sâu không gian
    const targetX = -2.02 + pointer.current.x * 0.28;
    const targetY = 0.96 + pointer.current.y * 0.24;
    groupRef.current.position.x = THREE.MathUtils.lerp(groupRef.current.position.x, targetX, 0.05);
    groupRef.current.position.y = THREE.MathUtils.lerp(groupRef.current.position.y, targetY, 0.05);
    groupRef.current.rotation.y = -0.25 + Math.sin(t * 0.8) * 0.22 + pointer.current.x * 0.28;
  });

  return (
    <group ref={groupRef} position={[-2.02, 0.96, 0.38]}>
      <Float speed={1.8} rotationIntensity={0.25} floatIntensity={0.5}>
        {/* Nền huy hiệu trắng kem mềm */}
        <mesh castShadow>
          <cylinderGeometry args={[0.42, 0.42, 0.14, 40]} />
          <meshStandardMaterial color="#FAF9F6" roughness={0.55} />
        </mesh>
        <group rotation={[Math.PI / 2, 0, 0]} position={[0, 0, 0.08]}>
          {/* Thanh dọc dấu cộng y tế */}
          <mesh castShadow>
            <boxGeometry args={[0.14, 0.44, 0.09]} />
            <meshStandardMaterial color="#0F766E" roughness={0.42} />
          </mesh>
          {/* Thanh ngang dấu cộng y tế */}
          <mesh castShadow>
            <boxGeometry args={[0.44, 0.14, 0.09]} />
            <meshStandardMaterial color="#0F766E" roughness={0.42} />
          </mesh>
        </group>
      </Float>
    </group>
  );
}

/**
 * Dấu chân Thú cưng Soft Clay 3D bay lơ lửng góc dưới phải
 */
function FloatingPawBadge({ pointer }: { pointer: React.MutableRefObject<PointerRef> }) {
  const groupRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    if (!groupRef.current) return;
    // Parallax tốc độ cao hơn (0.72x) tạo cảm giác gần camera hơn
    const targetX = 1.98 + pointer.current.x * 0.54;
    const targetY = -0.78 + pointer.current.y * 0.38;
    groupRef.current.position.x = THREE.MathUtils.lerp(groupRef.current.position.x, targetX, 0.07);
    groupRef.current.position.y = THREE.MathUtils.lerp(groupRef.current.position.y, targetY, 0.07);
    groupRef.current.rotation.z = -0.18 + Math.sin(t * 1.1) * 0.12;
    groupRef.current.rotation.y = -0.2 + pointer.current.x * 0.4;
  });

  return (
    <group ref={groupRef} position={[1.98, -0.78, 0.72]}>
      <Float speed={2.1} rotationIntensity={0.28} floatIntensity={0.42}>
        {/* Đệm chân chính */}
        <mesh position={[0, -0.06, 0]} scale={[1.18, 0.92, 0.62]} castShadow>
          <sphereGeometry args={[0.2, 28, 28]} />
          <meshStandardMaterial color="#0F766E" roughness={0.5} />
        </mesh>
        {/* 4 ngón chân nhỏ */}
        {[
          [-0.22, 0.14, 0],
          [-0.08, 0.24, 0],
          [0.08, 0.24, 0],
          [0.22, 0.14, 0],
        ].map(([px, py, pz], idx) => (
          <mesh key={idx} position={[px, py, pz]} scale={[0.9, 1.08, 0.65]} castShadow>
            <sphereGeometry args={[0.082, 24, 24]} />
            <meshStandardMaterial color="#14B8A6" roughness={0.48} />
          </mesh>
        ))}
      </Float>
    </group>
  );
}

/**
 * Các viên cầu kính y khoa bay lơ lửng tạo chiều sâu không gian
 */
function AmbientOrbs({ pointer }: { pointer: React.MutableRefObject<PointerRef> }) {
  const orbRef = useRef<THREE.Group>(null);

  useFrame(() => {
    if (!orbRef.current) return;
    orbRef.current.position.x = THREE.MathUtils.lerp(
      orbRef.current.position.x,
      -pointer.current.x * 0.35,
      0.04
    );
    orbRef.current.position.y = THREE.MathUtils.lerp(
      orbRef.current.position.y,
      -pointer.current.y * 0.28,
      0.04
    );
  });

  return (
    <group ref={orbRef}>
      <Float speed={1.4} floatIntensity={0.4}>
        <mesh position={[-1.85, -0.72, 0.55]}>
          <sphereGeometry args={[0.16, 28, 28]} />
          <meshPhysicalMaterial
            color="#99F6E4"
            transmission={0.85}
            roughness={0.12}
            ior={1.4}
            thickness={0.8}
          />
        </mesh>
      </Float>
      <Float speed={1.9} floatIntensity={0.35}>
        <mesh position={[-1.28, 1.65, -0.35]}>
          <sphereGeometry args={[0.11, 24, 24]} />
          <meshStandardMaterial color="#FDBA74" roughness={0.5} />
        </mesh>
      </Float>
      <Float speed={1.6} floatIntensity={0.3}>
        <mesh position={[1.45, 1.58, -0.4]}>
          <sphereGeometry args={[0.09, 24, 24]} />
          <meshStandardMaterial color="#5EEAD4" roughness={0.45} />
        </mesh>
      </Float>
    </group>
  );
}

function SpatialMedicalRig({
  pointer,
  scrollRatioRef,
}: {
  pointer: React.MutableRefObject<PointerRef>;
  scrollRatioRef: React.MutableRefObject<number>;
}) {
  const clusterRef = useRef<THREE.Group>(null);

  useFrame(() => {
    if (!clusterRef.current) return;
    const scroll = scrollRatioRef.current;

    // Khẽ xoay nhìn theo tọa độ con trỏ chuột với độ trễ có trọng lượng (lerp)
    const targetRotY = pointer.current.x * 0.34;
    const targetRotX = -pointer.current.y * 0.22;
    clusterRef.current.rotation.y = THREE.MathUtils.lerp(
      clusterRef.current.rotation.y,
      targetRotY,
      0.055
    );
    clusterRef.current.rotation.x = THREE.MathUtils.lerp(
      clusterRef.current.rotation.x,
      targetRotX,
      0.055
    );

    // Khi cuộn xuống dưới Hero, cụm 3D tự động thu nhỏ nhẹ và trượt tinh tế
    const targetScale = 1 - scroll * 0.18;
    const targetY = -scroll * 0.55;
    clusterRef.current.scale.setScalar(
      THREE.MathUtils.lerp(clusterRef.current.scale.x, targetScale, 0.08)
    );
    clusterRef.current.position.y = THREE.MathUtils.lerp(
      clusterRef.current.position.y,
      targetY,
      0.08
    );
  });

  return (
    <group ref={clusterRef} position={[0, -0.05, 0]}>
      <ProtectiveGlassArch />
      <SoftClayPet />
      <FloatingMedicalHeart pointer={pointer} />
      <FloatingMedicalShield pointer={pointer} />
      <FloatingPawBadge pointer={pointer} />
      <AmbientOrbs pointer={pointer} />
    </group>
  );
}

export function HeroClayScene({
  scrollRatioRef,
}: {
  scrollRatioRef: React.MutableRefObject<number>;
}) {
  const pointer = useRef<PointerRef>({ x: 0, y: 0 });

  useEffect(() => {
    const handlePointerMove = (e: PointerEvent) => {
      const nx = (e.clientX / window.innerWidth) * 2 - 1;
      const ny = -((e.clientY / window.innerHeight) * 2 - 1);
      pointer.current.x = Math.max(-1, Math.min(1, nx));
      pointer.current.y = Math.max(-1, Math.min(1, ny));
    };

    window.addEventListener("pointermove", handlePointerMove, { passive: true });
    return () => window.removeEventListener("pointermove", handlePointerMove);
  }, []);

  return (
    <div className="h-full w-full select-none">
      <Canvas
        dpr={[1, 1.75]}
        shadows
        camera={{ position: [0, 0.35, 5.4], fov: 40 }}
        gl={{
          antialias: true,
          alpha: true,
          powerPreference: "high-performance",
        }}
      >
        <ambientLight intensity={0.72} color="#FFFBF4" />
        <directionalLight
          position={[4.5, 6.2, 5.0]}
          intensity={1.35}
          color="#FFF7ED"
          castShadow
          shadow-mapSize={[1024, 1024]}
        />
        <directionalLight position={[-4.5, 3.0, -3.5]} intensity={0.75} color="#99F6E4" />
        <pointLight position={[0, 1.4, 2.8]} intensity={0.45} color="#FED7AA" />

        {/* Procedural Studio Environment (100% nội bộ, KHÔNG phụ thuộc file HDR ngoại vi) */}
        <Environment resolution={128}>
          <Lightformer
            form="rect"
            intensity={2.4}
            color="#FFFBF2"
            scale={[8, 4, 1]}
            position={[0, 5, 3]}
            rotation={[Math.PI / 3, 0, 0]}
          />
          <Lightformer
            form="circle"
            intensity={2.2}
            color="#CCFBF1"
            scale={4}
            position={[-5, 2, 1]}
            rotation={[0, Math.PI / 2, 0]}
          />
          <Lightformer
            form="circle"
            intensity={1.6}
            color="#FFEDD5"
            scale={3.5}
            position={[5, 1, 2]}
            rotation={[0, -Math.PI / 2, 0]}
          />
        </Environment>

        <SpatialMedicalRig pointer={pointer} scrollRatioRef={scrollRatioRef} />

        <ContactShadows
          position={[0, -1.36, 0]}
          opacity={0.3}
          scale={7.2}
          blur={2.4}
          far={3.6}
          color="#132A2E"
        />
      </Canvas>
    </div>
  );
}
