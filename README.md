jDrag is a low-level drag and drop library for in-browser dragging operations
using jQuery. It draws inspiration from several different drag and drop
implementations, including Cocoa and HTML5.

For more information about these, see:

http://developer.apple.com/library/mac/#documentation/Cocoa/Conceptual/DragandDrop/DragandDrop.html
http://dev.w3.org/html5/spec/dnd.html

## API

The following functions make up the public interface:

    jQuery.prototype.dragSource
    jQuery.prototype.dragTarget

A `jDrag.Handle` object is just a placeholder object that gives the end user
feedback about the current position of the drag operation.

    jDrag.Handle($obj, offset=$obj.offset())
    jDrag.Handle.append(offset=this.offset)
    jDrag.Handle.moveTo(offset=this.offset)
    jDrag.Handle.moveBy(offset)
    jDrag.Handle.remove()

A `jDrag.Source` object represents the "source" of a drag and drop operation. It
stems from a click/tap on some DOM element and can carry with it an arbitrary
payload of data. The public API is listed below:

    jDrag.Source($obj, data={})
    jDrag.Source.makeHandle($obj)

A source emits the following events:

  - dragstart      Fired when the source first starts dragging.
  - drag           Fired repeatedly as the source drags.
  - dragend        Fired when the source stops dragging.

A `jDrag.Target` object represents a drop target for a drag source.

    jDrag.Target($obj, threshold=0.5)
    jDrag.Target.prototype.listen(source)
    jDrag.Target.prototype.containsHandle(handle)
    jDrag.Target.prototype.contains(width, height, left, top)

A target emits the following events:

  - dragenter      Fired when a drag source enters this target's area
                   when it was previously outside. Receives the source
                   as its argument.
  - dragover       Fired repeatedly as a source is dragged over this
                   target. Receives the source as its argument.
  - drop           Fired when a drag source is "dropped" on this
                   target. Receives the source as its argument.
  - dragleave      Fired when a drag source leaves this target's area.
                   Receives the source as its argument.

For detailed documentation on the arguments of each method in the public
interface, please read the source. :)

The order of events in a drag operation should be similar to this:

  - dragstart
  - drag
  - dragenter
  - dragover
  - dragleave/drop
  - dragend

## Usage

    // The #source element is the one that the user clicks/taps on
    // to start dragging. You can pass an arbitrary data object here
    // that will be used as the source's "data" property. The source
    // is an instance of jDrag.Source.
    var source = $("#source").dragSource(data);

    // The #target element is an element the user can "drop" drag
    // sources on. The target is an instance of jDrag.Target.
    var target = $("#target").dragTarget();

    // Tell the target to listen for drag events on the given source.
    // This must be done for each source/target pair that you wish to
    // associate.
    target.listen(source);

    $(source).bind("dragstart", function (e) {
      console.log("started dragging");
    });

    $(target).bind("drop", function (e, source) {
      console.log(source.data);
    });

## License

Copyright 2012 Michael Jackson

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

The software is provided "as is", without warranty of any kind, express or
implied, including but not limited to the warranties of merchantability,
fitness for a particular purpose and non-infringement. In no event shall the
authors or copyright holders be liable for any claim, damages or other
liability, whether in an action of contract, tort or otherwise, arising from,
out of or in connection with the software or the use or other dealings in
the software.
