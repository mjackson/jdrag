/*!
 * jdrag.js - Simple drag and drop for jQuery
 * http://github.com/mjijackson/jdrag.js
 */
var jDrag = {};

(function (jQuery, exports) {

  var supportsTouch = "createTouch" in document;

  exports.version = "0.1.0";
  exports.Handle = Handle;
  exports.Source = Source;
  exports.Target = Target;

  // The current source being dragged.
  var currentSource = null;

  exports.currentSource = function () {
    return currentSource;
  };

  jQuery.fn.dragSource = function (data) {
    return new Source(this.first(), data);
  };

  jQuery.fn.dragTarget = function () {
    return new Target(this.first());
  };

  /**
   * A drag handle is a DOM node that is temporarily inserted into the DOM
   * when dragging to give the user some visual feedback. It doesn't contain
   * any data in and of itself.
   */
  function Handle($obj, offset) {
    this.jQuery = $obj;
    this.jQuery.addClass(Handle.className);
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
   */
  function Target($obj) {
    this.jQuery = $obj;
    this.isActive = false;
  }

  /**
   * Starts listening to the given drag source.
   */
  Target.prototype.listen = function (source) {
    var self = this;
    var $this = $(this);

    // Keeps track of whether or not this target is active for
    // the given drag source.
    var isActive = false;

    $(source).bind({
      drag: function (e, point) {
        var wasActive = isActive;
        isActive = self.containsPoint(point);

        if (isActive) {
          if (!wasActive) {
            $this.trigger("dragenter", this);
          }

          $this.trigger("dragover", this);
        } else if (wasActive) {
          $this.trigger("dragleave", this);
        }
      },
      drop: function (e, point) {
        isActive = self.containsPoint(point);

        if (isActive) {
          $this.trigger("drop", this);
        }
      }
    });

    $(this).bind("drop", function (e, source) {
      isActive = false;
      currentTarget = null;
    });

    return this;
  };

  /**
   * Returns `true` if this target's area contains the given point.
   */
  Target.prototype.containsPoint = function (point) {
    var x = point.x;
    var y = point.y;

    var offset = this.jQuery.offset();

    var left = offset.left;
    var right = left + this.jQuery.width();

    if (x < left || x > right) {
      return false;
    }

    var top = offset.top;
    var bottom = top + this.jQuery.height();

    return top < y && bottom > y;
  };

  function startListening() {
    $(document).mousemove(drag).mouseup(drop);
  }

  function stopListening() {
    $(document).unbind("mousemove", drag).unbind("mouseup", drop);
  }

  var lastX, lastY;

  function drag(e) {
    var x = e.clientX;
    var y = e.clientY;

    if (!currentSource.isDragging) {
      jQuery(currentSource).trigger("dragstart");
      lastX = x;
      lastY = y;
    }

    // Update the position of the drag handle.
    var changeLeft = x - lastX;
    var changeTop = y - lastY;

    if (changeLeft || changeTop) {
      currentSource.handle.moveBy({left: changeLeft, top: changeTop});
    }

    // Update last cursor positions for next drag event.
    lastX = x;
    lastY = y;

    jQuery(currentSource).trigger("drag", {x: x, y: y});
  }

  function drop(e) {
    if (currentSource.isDragging) {
      jQuery(currentSource).trigger("drop", {x: e.clientX, y: e.clientY});
      jQuery(currentSource).trigger("dragend");
    }

    currentTarget = null;
    currentSource = null;

    stopListening();
  }

})(jQuery, jDrag);
