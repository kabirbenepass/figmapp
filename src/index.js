import jp from "jsonpath";
import { data } from "./test";

let parser = {};

const parent = (o) => Object.getPrototypeOf(o).name;

class Transformer {
  constructor() {
    this.index = {};
    this.tree = {};
  }

  when(cond, cls) {
    const A = cls.name;
    const B = parent(cls);
    console.log("args", A, B);
    let entry = {
      name: A,
      cls,
      conds: [cond],
      children: []
    };
    if (A in this.index) {
      this.index[A].conds.push(cond);
      return this;
    }
    this.index[A] = entry;
    if (B in this.index) {
      this.index[B].children.push(entry);
    } else {
      this.tree[A] = entry;
    }
    return this;
  }

  run(object, ctx = {}, current = null) {
    let options = current
      ? current.children
      : [...Object.keys(this.tree)].map((k) => this.index[k]);

    for (let opt of options) {
      for (let cond of opt.conds) {
        if (cond(object, ctx)) {
          return this.run(object, ctx, opt) || new opt.cls(object, this, ctx);
        }
      }
    }

    if (current === null) {
      throw new Error(`Unmatchable object: ${object.name} ${object.type}`);
    }
    return false;
  }
}

class Component {
  constructor(args, xfrm, ctx) {
    this.name = args.name || args.type;
  }
}

class Button {
  constructor(args, xfrm, ctx) {
    this.id = `id${Math.random()}`;
    this.type = "Button";
    this.props = {
      title: args.children[0].children[0].name
    };
  }
}

class Container {
  constructor(args, xfrm, ctx) {
    this.name = args.name || args.type;
    this.children = args.children.map((c) =>
      xfrm.run(c, { ...ctx, parent: this })
    );
  }
}

const xf = new Transformer();
xf.when((o) => o.name.startsWith("Button"), Button)
  .when((o) => o.type === "FRAME", Container)
  .when((o) => o.name === "Label", Component)
  .when((o) => o.type === "TEXT", Component)
  .when((o) => o.name === "TextBox", Component)
  .when((o) => o.type === "CANVAS", Container);

console.log(JSON.stringify(xf.run(data), null, 2));
