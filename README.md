### MC Babel

`transform` takes a path to a file and uses babel to transform the content

#### Files

`babel.js` - babel.js standalone which can be fetched via `curl https://unpkg.com/babel-standalone@6.26.0/babel.min.js > babel.js`

`index.js` - exports `transform` and has debugger's vendors and mappings configuration.


### Testing

`node test` transforms the `test/input.js` file into mc compatible js.

#### input

```js
import { Services } from "devtools-modules"

const {a,...b} = {a:2, c:3, d:4}
const f = () => {foo}
```

#### output

```js
"use strict";

var _devtoolsModules = require("devtools/client/debugger/new/vendors")["devtoolsModules"];

function _objectWithoutProperties(obj, keys) { var target = {}; for (var i in obj) { if (keys.indexOf(i) >= 0) continue; if (!Object.prototype.hasOwnProperty.call(obj, i)) continue; target[i] = obj[i]; } return target; }

const _a$c$d = { a: 2, c: 3, d: 4 },
      { a } = _a$c$d,
      b = _objectWithoutProperties(_a$c$d, ["a"]);
const f = () => {
  foo;
};
```
