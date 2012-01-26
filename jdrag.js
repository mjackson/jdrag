/*!
 * jdrag.js - Simple drag and drop for jQuery
 * http://github.com/mjijackson/jdrag.js
 */
var jDrag = {};

(function (jQuery, exports) {

  exports.version = "0.1.0";
  exports.Handle = Handle;
  exports.Source = Source;
  exports.Target = Target;

  jQuery.fn.dragSource = function (data) {
    return new Source(this.first(), data);
  };

  jQuery.fn.dragTarget = function (threshold) {
    return new Target(this.first(), threshold);
  };

  /**
   * A drag handle is a DOM node that is temporarily inserted into the DOM
   * when dragging to give the user some visual feedback. It doesn't contain
   * any data in and of itself.
   */
  function Handle($obj, offset) {
    this.jQuery = $obj;
    this.offset = offset || $obj.offset();
  }

  // The opacity level to use for handles.
  Handle.opacity = 0.5;

  Handle.prototype.append = function (offset) {
    this.jQuery.appendTo(document.body).css({
      position: "absolute",
      opacity: Handle.opacity
    });
    return this.moveTo(offset);
  };

  Handle.prototype.moveTo = function (offset) {
    this.offset = offset || this.offset;
    this.jQuery.offset(this.offset);
    return this;
  };

  Handle.prototype.moveBy = function (offset) {
    var left = this.offset.left + (offset.left || 0);
    var top = this.offset.top + (offset.top || 0);
    return this.moveTo({left: left, top: top});
  };

  Handle.prototype.remove = function () {
    this.jQuery.remove();
    return this;
  };

  // The current drag source being dragged. There may only be one at a time.
  var currentSource = null;

  /**
   * A drag source is instantiated with a DOM element as its trigger and
   * an arbitrary payload of data.
   *
   * A Source emits the following events:
   *
   *   - dragstart      Fired when the source first starts dragging.
   *   - drag           Fired repeatedly as the source drags.
   *   - dragend        Fired when the source stops dragging.
   */
  function Source($obj, data) {
    this.jQuery = $obj;
    this.data = data || {};
    this.isDragging = false;

    jQuery(this).bind({
      dragstart: function (e) {
        this.isDragging = true;
        this.handle = Source.makeHandle(this.jQuery);
        this.handle.append();
      },
      dragend: function (e) {
        this.isDragging = false;
        this.handle.remove();
      }
    });

    var self = this;

    this.jQuery.mousedown(function (e) {
      currentSource = self;
      startListening();
    });
  }

  /**
   * Makes a Handle from the given jQuery `$obj`. This is exposed so that
   * users can override it when desired. By default it creates a new Handle
   * with a clone of the DOM element positioned at its current offset.
   */
  Source.makeHandle = function ($obj) {
    return new Handle($obj.clone(), $obj.offset());
  };

  /**
   * A drag target is an object that is able to listen to drag events from
   * a drag source and detect whether or not that source's handle falls
   * within the target's area.
   *
   * A Target emits the following events:
   *
   *   - dragenter      Fired when a drag source enters this target's area
   *                    when it was previously outside. Receives the source
   *                    as its argument.
   *   - dragover       Fired repeatedly as a source is dragged over this
   *                    target. Receives the source as its argument.
   *   - drop           Fired when a drag source is "dropped" on this
   *                    target. Receives the source as its argument.
   *   - dragleave      Fired when a drag source leaves this target's area.
   *                    Receives the source as its argument.
   *
   * A target uses its threshold to determine what percentage of a handle's area
   * must be within the target's area in order to consider the target an
   * "active" drop target for the source represented by that handle.
   */
  function Target($obj, threshold) {
    this.jQuery = $obj;
    this.threshold = parseFloat(threshold) || 0.5;
    this.isActive = false;
  }

  /**
   * Starts listening to the given drag source.
   */
  Target.prototype.listen = function (source) {
    var self = this;
    var $this = $(this);

    $(source).bind({
      drag: function (e) {
        var wasActive = self.isActive;
        self.isActive = self.containsHandle(this.handle);

        if (self.isActive) {
          if (!wasActive) {
            $this.trigger("dragenter", this);
          }

          $this.trigger("dragover", this);
        } else {
          if (wasActive) {
            $this.trigger("dragleave", this);
          }
        }
      },
      dragend: function (e) {
        if (self.isActive) {
          $this.trigger("drop", this);
          self.isActive = false;
        }
      }
    });
  };

  /**
   * Returns `true` if this target's area contains the given `handle`.
   */
  Target.prototype.containsHandle = function (handle) {
    var width = handle.jQuery.width();
    var height = handle.jQuery.height();
    var offset = handle.offset;

    return this.contains(width, height, offset.left, offset.top);
  };

  /**
   * Returns `true` if this target's area contains an object with the given
   * dimensions and offsets.
   */
  Target.prototype.contains = function (width, height, left, top) {
    var right = left + width;
    var bottom = top + height;

    var ownWidth = this.jQuery.width();
    var ownHeight = this.jQuery.height();
    var ownOffset = this.jQuery.offset();
    var ownLeft = ownOffset.left;
    var ownTop = ownOffset.top;
    var ownRight = ownLeft + ownWidth;
    var ownBottom = ownTop + ownHeight;

    var overlapX;
    if (right > ownLeft && left < ownRight) {
      overlapX = Math.min(right, ownRight) - Math.max(left, ownLeft);
    } else {
      return false;
    }

    var overlapY;
    if (bottom > ownTop && top < ownBottom) {
      overlapY = Math.min(bottom, ownBottom) - Math.max(top, ownTop);
    } else {
      return false;
    }

    var overlap = (overlapX * overlapY) / (width * height);

    return overlap >= this.threshold;
  };

  function startListening() {
    $(document).mousemove(drag).mouseup(drop);
  }

  function stopListening() {
    $(document).unbind("mousemove", drag).unbind("mouseup", drop);
  }

  var cursorX, cursorY;

  function drag(e) {
    if (!currentSource.isDragging) {
      jQuery(currentSource).trigger("dragstart");
    }

    // Update the position of the drag handle.
    var left = e.clientX - cursorX;
    var top = e.clientY - cursorY;
    currentSource.handle.moveBy({left: left, top: top});

    // Update cursor positions for next drag event.
    cursorX = e.clientX;
    cursorY = e.clientY;

    jQuery(currentSource).trigger("drag");
  }

  function drop(e) {
    if (currentSource.isDragging) {
      jQuery(currentSource).trigger("dragend");
    }

    stopListening();
  }

})(jQuery, jDrag);
