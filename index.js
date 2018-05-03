const Babel = require("./babel")
const fs = require("fs")
const _path = require("path");


const mappings = {
  "./source-editor": "devtools/client/sourceeditor/editor",
  "../editor/source-editor": "devtools/client/sourceeditor/editor",
  "./test-flag": "devtools/shared/flags",
  "./fronts-device": "devtools/shared/fronts/device",
  react: "devtools/client/shared/vendor/react",
  redux: "devtools/client/shared/vendor/redux",
  "react-dom": "devtools/client/shared/vendor/react-dom",
  lodash: "devtools/client/shared/vendor/lodash",
  immutable: "devtools/client/shared/vendor/immutable",
  "react-redux": "devtools/client/shared/vendor/react-redux",
  "prop-types": "devtools/client/shared/vendor/react-prop-types",
  "devtools-reps": "devtools/client/shared/components/reps/reps.js",
  "devtools-source-map": "devtools/client/shared/source-map/index.js",

  "wasmparser/dist/WasmParser": "devtools/client/shared/vendor/WasmParser",
  "wasmparser/dist/WasmDis": "devtools/client/shared/vendor/WasmDis",

  // The excluded files below should not be required while the Debugger runs
  // in Firefox. Here, "devtools/shared/flags" is used as a dummy module.
  "../assets/panel/debugger.properties": "devtools/shared/flags",
  "devtools-connection": "devtools/shared/flags",
  "chrome-remote-interface": "devtools/shared/flags",
  "devtools-launchpad": "devtools/shared/flags"
};

const vendors = [
  "devtools-contextmenu",
  "devtools-splitter",
  "devtools-components",
  "devtools-config",
  "react-transition-group/Transition",
  "fuzzaldrin-plus",
  "reselect",
  "classnames",
  "url",
  "devtools-modules",
  "devtools-utils",
  "/Svg",
];


function isRequire(t, node) {
  return node && t.isCallExpression(node) && node.callee.name == "require";
}

function transformMC({ types: t }) {
  return {
    visitor: {
      ModuleDeclaration(path, state) {
        const source = path.node.source;
        const value = source && source.value;
        if (value && value.includes(".css")) {
          path.remove();
        }
      },

      StringLiteral(path, state) {
        const { mappings, vendors, filePath } = state.opts;
        let value = path.node.value;

        if (!isRequire(t, path.parent)) {
          return;
        }

        // Transform mappings
        if (Object.keys(mappings).includes(value)) {
          path.replaceWith(t.stringLiteral(mappings[value]));
          return;
        }

        // Transform vendors
        const isVendored = vendors.some(v => value.endsWith(v));
        if (isVendored) {
          path.replaceWith(
            t.stringLiteral("devtools/client/debugger/new/vendors")
          );

          value = value.split("/").pop();

          // Transform my-vendor-name into myVendorName
          let parts = value.split("-");
          parts = parts.map((part, index) => {
            if (index === 0) {
              return part.charAt(0).toLowerCase() + part.slice(1);;
            }
            return part.charAt(0).toUpperCase() + part.slice(1);
          })
          let exportedName = parts.join("");

          path.parentPath.replaceWith(
            t.memberExpression(path.parent, t.stringLiteral(exportedName), true)
          );
          return;
        }

        const dir = _path.dirname(filePath);
        const depPath = _path.join(dir, `${value}.js`);
        const exists = fs.existsSync(depPath);
        if (
          !exists &&
          !value.endsWith("index") &&
          !value.startsWith("devtools")
        ) {
          path.replaceWith(t.stringLiteral(`${value}/index`));
          return;
        }
      }
    }
  };
};

Babel.registerPlugin('transform-mc', transformMC);

module.exports = function transform(filePath) {
  const input = fs.readFileSync(filePath, 'utf8')

  return Babel.transform(input, {
    plugins: [
        "transform-flow-strip-types",
        "syntax-trailing-function-commas",
        "transform-class-properties",
        "transform-es2015-modules-commonjs",
        "transform-object-rest-spread",
        "transform-react-jsx",
        ["transform-mc", { mappings, vendors, filePath }]
      ]
    }
  ).code;
}
