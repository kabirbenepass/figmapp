class Transform {
  constructor() {
    this.index = {};
    this.roots = [];
    this.register = this._register.bind(this);
    this.wildcard = {};
  }

  _register({ elements, kind }) {
    const base = Object.getPrototypeOf;
    return {
      kind,
      elements,
      finisher: (cls) => {
        const name = cls.name;

        if (name in this.index) {
          console.warn(`Cannot re-register class ${name}`);
          return;
        }
        if (!cls.spec || cls.spec === base(cls).spec) {
          cls.spec = this.wildcard;
        }
        this.index[name] = {
          cls: cls,
          name: name,
          cond: cls.spec,
          children: []
        };

        let baseClass = base(cls);
        let baseName = baseClass.name;
        while (baseName) {
          if (baseName in this.index) {
            this.index[name].baseName = baseName;
            this.index[baseName].children.push(this.index[name]);
            return cls;
          } else {
            baseClass = base(baseClass);
            baseName = baseClass.name;
          }
        }
        this.roots.push(this.index[name]);
        return cls;
      }
    };
  }

  run(object, context = {}, options = null) {
    options = options || this.roots;
    for (let opt of options) {
      if (opt.cond === this.wildcard || opt.cond(object)) {
        const specialized = this.run(object, context, opt.children);
        if (specialized) {
          return specialized;
        } else if (opt.cond !== this.wildcard) {
          return new opt.cls(object, context);
        }
      }
    }
  }
}

const transform = new Transform();
export default transform;
