// ─────────────────────────────────────────────────────────────────────────────
// physics.js – Keplerian orbital mechanics + N-body gravity engine
// ─────────────────────────────────────────────────────────────────────────────
import * as THREE from 'three';
import { G } from './config.js';

// ── Keplerian position ─────────────────────────────────────────────────────────
/**
 * Returns the (x, 0, z) offset for a body that orbits at `orbitRadius`
 * with the given `angle` (radians).
 */
export function keplerianOffset(orbitRadius, angle) {
  return new THREE.Vector3(
    orbitRadius * Math.cos(angle),
    0,
    orbitRadius * Math.sin(angle)
  );
}

/**
 * Advance the Keplerian angle for one physics step.
 * @param {number} angle   current angle in radians
 * @param {number} period  orbital period in simulation years
 * @param {number} dt      time step in simulation years
 * @returns {number} new angle
 */
export function advanceAngle(angle, period, dt) {
  if (period <= 0) return angle;
  return angle + (2 * Math.PI * dt) / period;
}

// ── N-body engine ─────────────────────────────────────────────────────────────
/**
 * Compute the initial circular-orbit velocity for a body so that it keeps
 * a stable orbit around `centralBody` in the xz-plane.
 *
 * @param {THREE.Vector3} pos         body position (world space)
 * @param {THREE.Vector3} centralPos  central body position
 * @param {number}        centralMass central body mass
 * @returns {THREE.Vector3} initial velocity
 */
export function circularOrbitVelocity(pos, centralPos, centralMass) {
  const dx = pos.x - centralPos.x;
  const dz = pos.z - centralPos.z;
  const r = Math.sqrt(dx * dx + dz * dz);
  if (r < 0.001) return new THREE.Vector3();
  const speed = Math.sqrt((G * centralMass) / r);
  // Perpendicular to radius in the xz-plane (counter-clockwise)
  return new THREE.Vector3((-speed * dz) / r, 0, (speed * dx) / r);
}

/**
 * Apply gravitational forces between all body pairs and integrate one step.
 * Each body must have: { position: Vector3, velocity: Vector3, mass: number }
 *
 * Bodies with `fixed === true` are not moved (e.g. the Sun in hybrid mode).
 *
 * @param {Array}  bodies  array of body state objects
 * @param {number} dt      time step (simulation years)
 */
export function integrateNBody(bodies, dt) {
  const n = bodies.length;
  // Accumulate accelerations
  const acc = bodies.map(() => new THREE.Vector3());

  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      const a = bodies[i];
      const b = bodies[j];

      const dx = b.position.x - a.position.x;
      const dy = b.position.y - a.position.y;
      const dz = b.position.z - a.position.z;
      const dist2 = dx * dx + dy * dy + dz * dz;
      const dist = Math.sqrt(dist2);

      // Softening to avoid singularity when bodies get very close
      const softDist = Math.max(dist, SOFTENING);
      const factor = G / (softDist * softDist * softDist);

      const ax = dx * factor;
      const ay = dy * factor;
      const az = dz * factor;

      if (!a.fixed) {
        acc[i].x += ax * b.mass;
        acc[i].y += ay * b.mass;
        acc[i].z += az * b.mass;
      }
      if (!b.fixed) {
        acc[j].x -= ax * a.mass;
        acc[j].y -= ay * a.mass;
        acc[j].z -= az * a.mass;
      }
    }
  }

// Softening distance: prevents force singularities when two bodies occupy
// nearly the same position (clamps the effective separation to at least this value).
const SOFTENING = 1.5;
  for (let i = 0; i < n; i++) {
    if (bodies[i].fixed) continue;
    bodies[i].velocity.addScaledVector(acc[i], dt);
    bodies[i].position.addScaledVector(bodies[i].velocity, dt);
  }
}
