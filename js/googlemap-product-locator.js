$(function () {
  var gmarkersArr = [],
    markersArr = [],
    infowindow = new google.maps.InfoWindow({
      content: ''
    }),
    map,
    $countrySelectEle = $("#countrySelect"),
    $stateSelectEle = $("#stateSelect"),
    $productsCheckboxSection = $('.productsCheckboxSection'),
    selectedCountry = "ALL",
    selectedState = "ALL",
    allProductsArr = [],
    selectedProductsArr = [],
    minZoomLevel = 7,
    markerIconURL = "/public/images/markerIcons.png",
    markerWidth = 26, markerHeight = 26,
    productObj;

  initComboWidget();

  function loadLocationdata() {
    $.ajax({
      url: "data/locationsInfo.json",
      type: "GET",
      dataType: "json",
    }).done(function (data) {
      if (data && data.length) {
        markersArr = data;
        build();
      }
    }).fail(function (err) {
      console.log("Error getting the location data!!!");
    });
  }
  loadLocationdata();
  /**
   * Set the combo value and initlize the google map
   */
  function build() {
    _build();
      // Init map
    initialize();
  }

  function _build() {
    productObj = {
       cotton: {x:0, className:"cottonIcon", productName:"Cotton", counter: 0},
       corn: {x:52, className:"cornIcon", productName:"Corn, Soybeans", counter: 0},
       wheat: {x:26, className:"wheatIcon", productName:"Wheat", counter: 0},
       cereals: {x:130, className:"cerealsIcon", productName:"Cereals, Pulses, Oilseeds", counter: 0},
       sugarcane: {x:78, className:"sugarcaneIcon", productName:"Sugarcane", counter: 0},
       rice: {x:104, className:"riceIcon", productName:"Rice", counter: 0},
       almonds: {x:208, className:"almondsIcon", productName:"Almonds", counter: 0},
       vegetables: {x:182, className:"vegetablesIcon", productName:"Vegetables", counter: 0},
       fruits: {x:156, className:"fruitsIcon", productName:"Fruits", counter: 0},
       wine: {x:260, className:"wineIcon", productName:"Wine grapes", counter: 0},
       walnuts: {x:234, className:"walnutsIcon", productName:"Walnuts or Pistachios", counter: 0}
     };
    selectedCountry = "ALL";
    selectedState = "ALL";
    setCombodata('country', $countrySelectEle);
    setCombodata('state', $stateSelectEle);
    setProductsCheckboxs('ALL');
  }

  function setCombodata(type, $targetEle, isFilter) {
    var arrList = [];
    for (var i = 0; i < markersArr.length; i++) {
      if (arrList.indexOf(markersArr[i][type]) === -1) {
        if (!isFilter) {
          arrList.push(markersArr[i][type]);
        } else if (type === "state" && (markersArr[i].country === selectedCountry || selectedCountry === "ALL")) {
          arrList.push(markersArr[i][type]);
        } else if (type === "county" && (markersArr[i].country === selectedCountry || selectedCountry === "ALL") && (selectedState === "ALL" || markersArr[i].state === selectedState)) {
          arrList.push(markersArr[i][type]);
        } else if (type === "product" && (markersArr[i].country === selectedCountry || selectedCountry === "ALL") && (selectedState === "ALL" || markersArr[i].state === selectedState)) {
          arrList.push(markersArr[i][type]);
        }
      }
    }
    $targetEle
      .empty()
      .append('<option value="ALL">ALL</option>');
    arrList.sort();
    for (var j = 0; j < arrList.length; j++) {
      $targetEle.append('<option value="' + arrList[j] + '">' + arrList[j] + '</option>');
    }
    $targetEle.parent().find('.custom-combobox .custom-combobox-input').val("ALL");
  }
  /**
   * It will be triggered when country, state, county and product combobox selection
   */
  function onComboBoxChange(targetId, selectedValue) {

    if (targetId === "countrySelect") {
      selectedCountry = selectedValue;
      onCountryChange(selectedValue);
      if (selectedCountry === "ALL") {
        setProductsCheckboxs('ALL');
      } else {
        setProductsCheckboxs('country');
      }

    } else if (targetId === "stateSelect") {
      selectedState = selectedValue;
      setProductsCheckboxs('state');
    }
    filterMarkers();
  }
  /**
   * Remove the duplicate in the array based on the key
   * @param  {[Array]}  arr     Input array
   * @param  {[String]} prop    proprty of object array
   * @return {[Array]}  new_arr Unique array
   */
  function removeDuplicateArr(arr, prop) {
    var new_arr = [],
      lookup = {};
    if(prop){
      for (var i in arr) {lookup[arr[i][prop]] = arr[i];}
      for (i in lookup) { new_arr.push(lookup[i][prop]);}
    }else{
      for (var i in arr) { lookup[arr[i]] = arr[i]; }
      for (i in lookup) { new_arr.push(lookup[i]); }
    }
    return new_arr;
  }

  /**
   * Check the given product in current selected country
   * @param  {String}   country name of the selected country
   * @param  {String}   product product to be checked
   * @return {Boolean}  result
   */
  function isProductFoundInArr(type, product) {
    var result = false;
    if (type === 'country') {
      for (var i = 0; i < markersArr.length; i++) {
        if (markersArr[i].product === product && markersArr[i].country === selectedCountry) {
          result = true;
          break;
        }
      }
    } else {
      for (var ii = 0; ii < markersArr.length; ii++) {
        if (markersArr[ii].product === product && (markersArr[ii].state === selectedState || selectedState === "ALL")) {
          result = true;
          break;
        }
      }
    }
    return result;
  }
  function classNameByProduct(productName){
    var result;
    for (var item in productObj){
      if(productObj[item].productName === productName ){
        result = productObj[item].className;
      }
    }
    return result;
  }

  /**
   * It will generate list of products available in the list
   */
  function setProductsCheckboxs(type) {
    $productsCheckboxSection.empty();
    $productsCheckboxSection.append("<h4>Product List:</h4>");
    // Remove duplicate products
    allProductsArr = removeDuplicateArr(markersArr, 'product');
    $productsCheckboxSection.append('<div><input class="checkALL" type="checkbox" value="checkALL" checked>Check all</input></div>');
    for (var i = 0; i < allProductsArr.length; i++) {
      if (type === "ALL") {
        $productsCheckboxSection.append('<div class="productsList"><input type="checkbox" class="vcenter" value="' + allProductsArr[i] + '" checked><span  class="iconSize '+classNameByProduct(allProductsArr[i])+'"></span><span class="vcenter prodNameCls">' + allProductsArr[i] + '</span></input></div>');
        selectedProductsArr.push(allProductsArr[i]);
      } else if (type === "country" && isProductFoundInArr('country', allProductsArr[i])) {
        $productsCheckboxSection.append('<div class="productsList"><input type="checkbox" class="vcenter" value="' + allProductsArr[i] + '" checked><span  class="iconSize '+classNameByProduct(allProductsArr[i])+'"></span><span class="vcenter prodNameCls">' + allProductsArr[i] + '</span></input></div>');
        selectedProductsArr.push(allProductsArr[i]);
      } else if (type === "state" && isProductFoundInArr('state', allProductsArr[i])) {
        $productsCheckboxSection.append('<div class="productsList"><input type="checkbox" class="vcenter" value="' + allProductsArr[i] + '" checked><span  class="iconSize '+classNameByProduct(allProductsArr[i])+'"></span><span class="vcenter prodNameCls">' + allProductsArr[i] + '</span></input></div>');
        selectedProductsArr.push(allProductsArr[i]);
      }

    }
  }

  function returnProduct(value) {
    var result = "";
    for (var i = 0; i < allProductsArr.length; i++) {
      if (allProductsArr[i] === value) {
        result = allProductsArr[i];
        break;
      }
    }
    return result;
  }
  $productsCheckboxSection.click(function (evt) {
    var zeroSelection = true;
    selectedProductsArr = [];
    $target = $(evt.target);

    if ($target) {
      // Check all
      if( $target.hasClass("checkALL")){
        var checkedFlag = $target.is(':checked');
        $productsCheckboxSection.each(function(){
          $(this).find(".productsList input").prop("checked", checkedFlag);
        });
      }
      $productsCheckboxSection.find(".productsList input").each(function () {
        if ($(this).is(':checked')) {
          selectedProductsArr.push(returnProduct($(this).val()));
          zeroSelection = false;
        }
      });
      filterMarkers('checkbox');
      if (zeroSelection) {
        initMapNoMarker();
      }
    }
  });

  function onCountryChange(selectedValue) {
    selectedState = "ALL";
    setCombodata('state', $stateSelectEle, true);
  }

  /**
   * Function to init map
   */
  function initialize() {
    var center = new google.maps.LatLng(0, 0);

    var mapOptions = {
      zoom: 2,
      center: center,
      mapTypeId: google.maps.MapTypeId.TERRAIN
    };

    map = new google.maps.Map(document.getElementById('map-canvas'), mapOptions);
    // we need to move map position (X-direction ) in order to show the marker fully in the page

    for (var i = 0; i < markersArr.length; i++) {
      addMarker(markersArr[i]);
    }
    setUIProductCounter();
    map.panBy(40, 0);
  }

  function initMapNoMarker() {

    var center = new google.maps.LatLng(0, 0);
    map.setCenter(center);
    map.setZoom(2);
    // we need to move map position (X-direction ) in order to show the marker fully in the page
    map.panBy(40, 0);
  }

  /**
   * Function to add marker to map
   */

  function addMarker(markerObj) {

    var pos = new google.maps.LatLng(markerObj.lat, markerObj.lng),
      iconURL, googleIcon;
      //googleIconURL = 'http://maps.google.com/mapfiles/ms/micons/',
      //googleIconURL2 = 'http://maps.google.com/mapfiles/',
      //iconsArr = ['yellow-dot.png', 'blue-dot.png', 'green-dot.png', 'ltblue-dot.png', 'orange-dot.png', 'pink-dot.png', 'purple-dot.png', 'red-dot.png', 'marker_grey.png', 'marker_white.png', 'marker_black.png'];
   productCounter(markerObj.product);
   for (var item in productObj){
     if(productObj[item].productName === markerObj.product ){
       googleIcon = new google.maps.MarkerImage(markerIconURL, new google.maps.Size(markerWidth, markerHeight), new google.maps.Point(productObj[item].x, 0));
     }
    }
    var marker1 = new google.maps.Marker({
      position: pos,
      map: map,
      icon: googleIcon,
      detailObj: markerObj
    });
    gmarkersArr.push(marker1);

    // Limit the zoom level
    google.maps.event.addListener(map, 'zoom_changed', function () {
      if (map.getZoom() > minZoomLevel) map.setZoom(minZoomLevel);
    });

    // Marker click listener
    google.maps.event.addListener(marker1, 'click', (function (marker1, markerObj) {
      return function () {
        infowindow.setContent('<div class="popupContentMain"><h3>' + markerObj.product + '</h3><div class="popupContentField">Country:</div>' + markerObj.country +
          '<div><div class="popupContentField">State:</div>' + markerObj.state + '</div>' +
          '<div><div class="popupContentField">County:</div>' + markerObj.county + '</div>' +
          '<div><div class="popupContentField">Longitude Latitude:</div>' + markerObj.lat + ',' + markerObj.lng + '</div></div>');

        infowindow.open(map, marker1);
        map.panTo(this.getPosition());
        //map.setZoom(15);
      };
    })(marker1, markerObj));
  }
 function resetProductCounter(){
   for (var item in productObj){
      productObj[item].counter = 0;
   }
 }
  function productCounter(productName){
    for (var item in productObj){
      if(productObj[item].productName === productName){
        productObj[item].counter += 1;
      }
    }
  }
  function setUIProductCounter(){
    for (var item in productObj){
       var $productNameEle = $('span.'+productObj[item].className).parent().find('.prodNameCls');
       if($productNameEle.length){
         $productNameEle.html(productObj[item].productName+ ' ('+productObj[item].counter+')');
       }
    }
  }
  /**
   * Function to filter markers by category
   */
  function filterMarkers(checkboxAction) {
    var bounds = new google.maps.LatLngBounds(),
      markerCount = 0,
      countryList = [],
      usaAusFound = false;
     resetProductCounter(); // Reset the existing product counters

    for (var i = 0; i < markersArr.length; i++) {
      var marker = gmarkersArr[i].detailObj,
        prodFound = false;
      // If is same category or category not picked
      for (var j = 0; j < selectedProductsArr.length; j++) {
        if (marker.product === selectedProductsArr[j]) {
          prodFound = true;
        }
      }
      if ((marker.country === selectedCountry || selectedCountry === "ALL") && (marker.state === selectedState || selectedState === "ALL") && prodFound) {
        countryList.push(marker.country.toLowerCase());
        gmarkersArr[i].setVisible(true);
        bounds.extend(gmarkersArr[i].position);
        markerCount += 1;
        productCounter(marker.product);
      }
      // Categories don't match
      else {
        gmarkersArr[i].setVisible(false);
        //productCounter(marker.product);
      }

    }
    if(!checkboxAction){
      setUIProductCounter();
    }
    countryList = removeDuplicateArr(countryList);
    if (countryList.length > 2) {
      for (var ii = 0; ii < countryList.length; ii++) {
        if ((countryList[ii].indexOf('usa') !== -1 || countryList[ii].indexOf('us') !== -1 || countryList[ii].indexOf('united states of america') !== -1) && countryList[ii].indexOf('australia') !== -1) {
          usaAusFound = true;
        }
      }
    }
    // we dont need to fitBounds if USA and australia countries are there as it display the looped map(weired)
    if (usaAusFound) {
      var center = new google.maps.LatLng(0, 0);
      map.setCenter(center);
      map.setZoom(2);
      // we need to move map position (X-direction ) in order to show the marker fully in the page
      map.panBy(40, 0);
      console.log("USA and Australia found");
    } else {
      map.fitBounds(bounds);
    }
    if (markerCount > 0 && markerCount < 3) {
      map.setZoom(5);
    }
  }

  function initComboWidget() {
    $.widget("custom.combobox", {
      _create: function () {
        this.wrapper = $("<span>")
          .addClass("custom-combobox")
          .insertAfter(this.element);

        this.element.hide();
        this._createAutocomplete();
        this._createShowAllButton();
      },

      _createAutocomplete: function () {
        var selected = this.element.children(":selected"),
          value = selected.val() ? selected.text() : "";

        this.input = $("<input>")
          .appendTo(this.wrapper)
          .val(value)
          .attr("title", "")
          .addClass("custom-combobox-input ui-widget ui-widget-content ui-state-default ui-corner-left")
          .autocomplete({
            delay: 0,
            minLength: 0,
            source: $.proxy(this, "_source")
          })
          .tooltip({
            classes: {
              "ui-tooltip": "ui-state-highlight"
            }
          });

        this._on(this.input, {
          autocompleteselect: function (event, ui) {
            ui.item.option.selected = true;

            onComboBoxChange(this.element[0].id, ui.item.option.value);
            this._trigger("select", event, {
              item: ui.item.option
            });
          },

          autocompletechange: "_removeIfInvalid"
        });
      },

      _createShowAllButton: function () {
        var input = this.input,
          wasOpen = false;

        $("<a>")
          .attr("tabIndex", -1)
          .attr("title", "Show All Items")
          .tooltip()
          .appendTo(this.wrapper)
          .button({
            icons: {
              primary: "ui-icon-triangle-1-s"
            },
            text: false
          })
          .removeClass("ui-corner-all")
          .addClass("custom-combobox-toggle ui-corner-right")
          .on("mousedown", function () {
            wasOpen = input.autocomplete("widget").is(":visible");
          })
          .on("click", function () {
            input.trigger("focus");

            // Close if already visible
            if (wasOpen) {
              return;
            }

            // Pass empty string as value to search for, displaying all results
            input.autocomplete("search", "");
          });
      },

      _source: function (request, response) {
        var matcher = new RegExp($.ui.autocomplete.escapeRegex(request.term), "i");
        response(this.element.children("option").map(function () {
          var text = $(this).text();
          if (this.value && (!request.term || matcher.test(text)))
            return {
              label: text,
              value: text,
              option: this
            };
        }));
      },

      _removeIfInvalid: function (event, ui) {

        // Selected an item, nothing to do
        if (ui.item) {
          return;
        }

        // Search for a match (case-insensitive)
        var value = this.input.val(),
          valueLowerCase = value.toLowerCase(),
          valid = false;
        this.element.children("option").each(function () {
          if ($(this).text().toLowerCase() === valueLowerCase) {
            this.selected = valid = true;
            return false;
          }
        });

        // Found a match, nothing to do
        if (valid) {
          return;
        }

        // Remove invalid value
        this.input
          .val("")
          .attr("title", value + " didn't match any item")
          .tooltip("open");
        this.element.val("");
        this._delay(function () {
          this.input.tooltip("close").attr("title", "");
        }, 2500);
        this.input.autocomplete("instance").term = "";
      },

      _destroy: function () {
        this.wrapper.remove();
        this.element.show();
      }
    });
    $countrySelectEle.combobox();
    $stateSelectEle.combobox();

    $(".resetBtn").button().on("click", function (evt) {
      _build();
      initMapNoMarker();
      filterMarkers();
    });
  }
});
