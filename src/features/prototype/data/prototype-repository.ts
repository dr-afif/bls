import {
  adminSnapshot,
  demoResources,
  instructorSnapshot,
  learnerSnapshot,
} from "./mock-data";
import type {
  DemoAdminSnapshot,
  DemoResource,
  InstructorSnapshot,
  LearnerSnapshot,
} from "./types";

export interface PrototypeRepository {
  getLearnerSnapshot(): Promise<LearnerSnapshot>;
  getInstructorSnapshot(): Promise<InstructorSnapshot>;
  getAdminSnapshot(): Promise<DemoAdminSnapshot>;
  listResources(audience: "learner" | "instructor"): Promise<DemoResource[]>;
  getResource(id: string): Promise<DemoResource>;
}

const DEMO_DELAY_MS = 140;

function resolveDemo<T>(value: T): Promise<T> {
  return new Promise((resolve) => {
    window.setTimeout(() => resolve(value), DEMO_DELAY_MS);
  });
}

class MockPrototypeRepository implements PrototypeRepository {
  getLearnerSnapshot() {
    return resolveDemo(learnerSnapshot);
  }

  getInstructorSnapshot() {
    return resolveDemo(instructorSnapshot);
  }

  getAdminSnapshot() {
    return resolveDemo(adminSnapshot);
  }

  listResources(audience: "learner" | "instructor") {
    return resolveDemo(
      demoResources.filter((resource) => resource.audience.includes(audience)),
    );
  }

  getResource(id: string) {
    const resource = demoResources.find((item) => item.id === id);

    if (!resource) {
      return Promise.reject(new Error("Demo resource was not found."));
    }

    return resolveDemo(resource);
  }
}

export const prototypeRepository: PrototypeRepository =
  new MockPrototypeRepository();

