import _ from "lodash";
import { getFigmaScreen } from "./figmaAPI";
import transform from "./transform";

@transform.register
class Component {
  constructor(object, context) {
    this.type = Object.getPrototypeOf(this).constructor.name;
    this.style = object.style;
  }
}

@transform.register
class Frame extends Component {
  static spec = (o) =>
    o.type in { FRAME: 1, CANVAS: 1 } && !o.name.startsWith("Button");

  constructor(object, context) {
    super(object, context);
    this.type = "View";
    this.addChildren(object.children, context);
  }

  addChildren(children, context) {
    this.children = _(children)
      .map((c) => transform.run(c, context))
      .filter();
  }
}

@transform.register
class Row extends Frame {
  static spec = _.matches({ name: "Row" });

  constructor(object, context) {
    super(object, context);
    this.style = {
      ...this.style,
      flex: 1,
      flexDirection: "row"
    };
  }
}

@transform.register
class Button extends Component {
  static spec = (o) => o.name.startsWith("Button");

  constructor(object, context) {
    super(object, context);
    this.title = object.children[0].children[0].name;
  }
}

@transform.register
class Text extends Component {
  static spec = _.matches({ type: "TEXT" });

  constructor(object, context) {
    super(object, context);
    this.children = [object.name];
  }
}

const figmaJSON = getFigmaScreen("fakeFigmaIDNumber1");
const generatedReactCalls = transform.run(figmaJSON);
console.log(JSON.stringify(generatedReactCalls, null, 2));
