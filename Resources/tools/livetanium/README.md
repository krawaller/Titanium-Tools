# Livetanium

## Realtime app prototyping
  Made out of titanium, nodejs and unicorns, this library lets you code Titanium Mobile apps and see changes in realtime. It uses a nodejs server to pipe filechanges to the app, and these changes are applied in realtime. It iPhone only at the moment, but works in both the simulator and on the actual device. You can see [a quick walkthrough here](http://krawaller.se/livetanium.swf).

Check out the [demo](demo.js) code to figure out how to set it up. Then make sure you fire up the nodejs server found in Resources/server.js and point your `K.watch(host, port, window);` to your nodejs server.

This is an early release, so be warned. We're interested in gathering feedback on how to make Titanium Mobile development smoother, so please let us know what floats your boat.
 

LICENSE
---

Copyright (c) 2010 Krawaller

Permission is hereby granted, free of charge, to any person obtaining
a copy of this software and associated documentation files (the
"Software"), to deal in the Software without restriction, including
without limitation the rights to use, copy, modify, merge, publish,
distribute, sublicense, and/or sell copies of the Software, and to
permit persons to whom the Software is furnished to do so, subject to
the following conditions:

The above copyright notice and this permission notice shall be included
in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY
CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT,
TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE
SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
