// Stub for three/tsl - provides minimal exports for compatibility
// This allows packages that depend on three/tsl to load without errors

// Create stub functions and classes that match the TSL API signature
class Fn {
  constructor() {}
}

class Node {
  constructor() {}
}

class Attr {
  constructor() {}
}

// Export common TSL elements
module.exports = {
  Fn,
  Node,
  Attr,
  default: {
    Fn,
    Node,
    Attr,
  }
};

// Also support ES6 default export
module.exports.default = {
  Fn,
  Node,
  Attr,
};
