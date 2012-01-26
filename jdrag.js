/*!
 * jDrag - Simple drag and drop for jQuery
 * http://github.com/mjijackson/jdrag
 */
var jDrag = {};

(function ($, exports) {

  exports.version = "0.1.0";
  exports.Handle = Handle;
  exports.Source = Source;
  exports.Target = Target;

  $.fn.dragSource = function (data) {
    return new Source(this.first(), data);
  };

  $.fn.dragTarget = function () {
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

  // A class name to use for all handles.
  Handle.className = "jdrag-handle";

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
    this.isDragging = false; // Is this source currently being dragged?
    this.currentTargets = []; // All targets this source is currently over
    setupListeners(this);
  }

  Source.prototype.dragTo = function (point) {
    if (!this.isDragging) {
      this.isDragging = true;
      this.handle = Source.makeHandle(this);
      this.handle.append();
      $(this).trigger("dragstart");
      this._lastPoint = point;
    }

    // Update the position of the drag handle.
    var changeLeft = point.x - this._lastPoint.x;
    var changeTop = point.y - this._lastPoint.y;

    if (changeLeft || changeTop) {
      this.handle.moveBy({left: changeLeft, top: changeTop});
    }

    // Save current point so we can get the diff on next drag.
    this._lastPoint = point;

    $(this).trigger("drag", point);
  };

  Source.prototype.dropAt = function (point) {
    if (!this.isDragging) {
      return;
    }

    this.isDragging = false;
    this.handle.remove();

    // Trigger one last drag so all targets can update themselves.
    $(this).trigger("drag", point)

    // Trigger the "drop" event on all current targets.
    if (this.currentTargets.length > 0) {
      $(this.currentTargets).trigger("drop", this);
    }

    $(this).trigger("dragend");

    // Clear current targets *after* the dragend event fires.
    this.currentTargets = [];
  };

  Source.prototype._addCurrentTarget = function (target) {
    var index = $.inArray(target, this.currentTargets);

    if (index === -1) {
      this.currentTargets.push(target);
    }
  };

  Source.prototype._removeCurrentTarget = function (target) {
    var index = $.inArray(target, this.currentTargets);

    if (index !== -1) {
      this.currentTargets.splice(index, 1);
    }
  };

  /**
   * Makes a Handle for the given source. By default, this method creates a
   * clone of the source's jQuery object and positions it at the same position
   * in the document. This is exposed so that users can override it to create
   * custom handles when desired.
   */
  Source.makeHandle = function (source) {
    var $obj = source.jQuery;
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
  }

  /**
   * Starts listening to the given drag source.
   */
  Target.prototype.listen = function (source) {
    var self = this;
    var $this = $(this);

    // Is the source currently over this target?
    var over = false;

    $(source).bind("drag", function (e, point) {
      var wasOver = over;
      over = self.containsPoint(point);

      if (over) {
        if (!wasOver) {
          source._addCurrentTarget(self);
          $this.trigger("dragenter", this);
        }

        $this.trigger("dragover", this);
      } else if (wasOver) {
        source._removeCurrentTarget(self);
        $this.trigger("dragleave", this);
      }
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

  var supportsTouch = "createTouch" in document;
  var currentSource = null;

  function setupListeners(source) {
    source.jQuery.mousedown(function (e) {
      startListening(source);
    });
  }

  function startListening(source) {
    currentSource = source;
    $(document).mousemove(drag).mouseup(drop);
  }

  function stopListening() {
    currentSource = null;
    $(document).unbind("mousemove", drag).unbind("mouseup", drop);
  }

  function drag(e) {
    currentSource.dragTo({x: e.clientX, y: e.clientY});
  }

  function drop(e) {
    currentSource.dropAt({x: e.clientX, y: e.clientY});
    stopListening();
  }

})(jQuery, jDrag);
