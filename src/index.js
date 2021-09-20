import jp from "jsonpath";
import { data } from "./test";
import _ from "lodash";

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
          throw new Error(`Cannot re-register class ${name}`);
        }
        if (!cls.spec || cls.spec == base(cls).spec) {
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
      if (opt.cond == this.wildcard || opt.cond(object)) {
        const specialized = this.run(object, context, opt.children);
        if (specialized) {
          return specialized;
        } else if (opt.cond != this.wildcard) {
          return new opt.cls(object, context);
        }
      }
    }
  }
}

const transform = new Transform();

@transform.register
class Component {
  constructor(object, context) {
    this.name = object.name;
    this.type = object.type;
  }

  render() {
    return {};
  }
}

@transform.register
class Frame extends Component {
  static spec = (o) =>
    o.type in { FRAME: 1, CANVAS: 1 } && !o.name.startsWith("Button");
  constructor(object, context) {
    super(object, context);
    this.addChildren(object.children, context);
  }

  addChildren(children, context) {
    this.children = _(children)
      .map((c) => transform.run(c, context))
      .filter();
  }

  render() {
    return {};
  }
}

@transform.register
class Button extends Component {
  static spec = (o) => o.name.startsWith("Button");

  constructor(object, context) {
    super(object, context);
    this.title = object.children[0].children[0].name;
  }

  render() {
    return {};
  }
}

console.log(JSON.stringify(transform.run(data), null, 2));
