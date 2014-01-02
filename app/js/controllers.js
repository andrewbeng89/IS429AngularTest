'use strict';

/* Controllers */

angular.module('myApp.controllers', []).
  controller('MyCtrl1', [function() {
  	$('#navbar').children('.active').removeClass('active');
  	$('#view1').addClass('active');
  }])
  .controller('MyCtrl2', [function() {
  	$('#navbar').children('.active').removeClass('active');
  	$('#view2').addClass('active');
  }]);