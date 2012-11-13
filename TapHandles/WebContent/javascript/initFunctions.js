function initFunctions () {
	this.initMVC = function() {
		var resultPaneModel      = new $.ResultPaneModel();
		resultPaneView           = new $.ResultPaneView();
		new $.ResultPaneController(resultPaneModel, resultPaneView);

		var sampModel       = new $.SampModel();
		sampView            = new $.SampView();
		new $.SampController(sampModel, sampView);

		var tapModel       = new $.TapModel();
		tapView            = new $.TapView();
		new $.TapController(tapModel, tapView);

		var cartModel       = new $.CartModel();
		cartView            = new $.CartView();
		new $.CartControler(cartModel, cartView);

		var nodeFilterModel       = new $.NodeFilterModel();
		nodeFilterView            = new $.NodeFilterView();
		new $.NodeFilterController(nodeFilterModel, nodeFilterView);
	};

	this.initLayout = function() {
		$.alerts.overlayOpacity = 0.5;
		$.alerts.overlayColor = '#000';
		/*
		 * layout plugin, requires JQuery 1.7 or higher
		 * Split the bottom div in 3 splitters divs.
		 */		
		layoutPane = $('#accesspane').layout();
	};

	this.initNodeAccess = function() {
		showProcessingDialog("Fetching available nodes");
		nodeList = new Array();
		$.ajax({
			async: false,
			type: 'GET',
			dataType: 'json',
			url: "availablenodes",
			error: function() {hideProcessingDialog();loggedAlert("availablenodes failure") ;},
			success: function(data) {
				hideProcessingDialog();
				sessionID = data.sessionID;
				alert(sessionID);
				for( var i=0 ; i<data.nodes.length ; i++) {
					nodeList[nodeList.length] = {id:  data.nodes[i].key,  text: data.nodes[i].key};
				}
				$('input#node_selector').jsonSuggest(
						{data: nodeList
							, minCharacters: 0
							, onSelect: function(data){resultPaneView.fireNewNodeEvent($('#node_selector').val());}
						});
			}
		});

		
		
//		$.getJSON("availablenodes", {}, function(data) {
//			hideProcessingDialog();
//			if( processJsonError(data, "availablenodes failure") ) {
//				return;
//			}
//			else {
//				sessionID = data.sessionID;
//				alert(sessionID);
//				for( var i=0 ; i<data.nodes.length ; i++) {
//					nodeList[nodeList.length] = {id:  data.nodes[i].key,  text: data.nodes[i].key};
//				}
//				$('input#node_selector').jsonSuggest(
//						{data: nodeList
//							, minCharacters: 0
//							, onSelect: function(data){resultPaneView.fireNewNodeEvent($('#node_selector').val());}
//						});
//			}
//		}
//		);

		$("input#node_selector").keypress(function(event) {
			if (event.which == '13') {
				resultPaneView.fireNewNodeEvent($('#node_selector').val());
			}
		});
		/*
		 * Name resolver buton activation
		 */
		$(".kw_filter").keyup(function(event) {
			var val = $(this).val();
			tapView.fireFilterColumns(val);
			$('.kw_filter').val(val);

		});
		/*
		 * Change the table displayed in the KW lists
		 */
		$('.table_filter').change(function() {
			tapView.fireChangeTable(this.value);
		});
	};

	this.initDataTree = function() {
		dataTree = $("div#treedisp").jstree({
			"json_data"   : {"data" : [ {  "attr"     : { "id"   : "rootid", "title": "Dummy node: Select one first with the node selector on the page top." },
				"data"        : { "title"   : "Tap Nodes" }}]}  , 
				"plugins"     : [ "themes", "json_data", "dnd", "crrm"],
				"dnd"         : {"drop_target" : "#resultpane,#taptab,#showquerymeta",
					"drop_finish" : function (data) {
						var parent = data.r;
						var streepath = data.o.attr("id").split(';');
						if( streepath.length < 3 ) {
							loggedAlert("Query can only be applied on one data category or one data class: ("  +  streepath + ")", 'User Input Error');
						}
						else {
							var treePath = {nodekey: streepath[0], schema: streepath[1], table: streepath[2]};
							while(parent.length != 0  ) {
								resultPaneView.fireSetTreePath(treePath);	
								if(parent.is('#resultpane') ) {
									setTitlePath(treePath);
									resultPaneView.fireTreeNodeEvent(treePath);	
									return;
								}
								else if(parent.attr('id') == "showquerymeta" ) {
									resultPaneView.fireShowMetaNode(treePath);	
									return;
								}

								else if(  parent.attr('id') == "taptab") {
									tapView.fireTreeNodeEvent(treePath);	
									return;
								}
								parent = parent.parent();
							}
						}
					}
				},
				// Node sorting by DnD blocked
				"crrm" : {"move" : {"check_move" : function (m) {return false; }}
				}
		}); // end of jstree

		dataTree.bind("dblclick.jstree", function (e, data) {
			var node = $(e.target).closest("li");
			var id = node[0].id; //id of the selected node					
			var treePath = id.split(';');
			if( treePath.length == 1 ) {
				var nm = $(e.target).closest("a")[0].id;
				if( nm != "" ) {
					nodeFilterView.fireOpenSelectorWindow(nm);
				}
			} else if( treePath.length < 3 ) {
				loggedAlert("Query can only be applied on one data category or one data class: ("  +  treePath + ")", 'User Input Error');
			} else {
				var fTreePath = {nodekey: treePath[0], schema: treePath[1], table: treePath[2]};
				resultPaneView.fireSetTreePath(fTreePath);	
				setTitlePath(fTreePath);
				resultPaneView.fireTreeNodeEvent(fTreePath);	
			}
		});
		var rootUrl = "http://" + window.location.hostname +  (location.port?":"+location.port:"") + window.location.pathname;
		/*
		 * Connect the URL passed as parameter
		 */
		var defaultUrl  =  (RegExp('url=' + '(.+?)(&|$)').exec(location.search)||[,null])[1];
		if( defaultUrl != null ) {
			resultPaneView.fireNewNodeEvent(unescape(defaultUrl));
		}
	}

	this.initQueryForm = function() {
		/*
		 * Activate submit buttons
		 */
		$('#submitquery').click(function() {
			resultPaneView.fireSubmitQueryEvent();
		});
		$("#qlimit").keyup(function(event) {
			if( $("#qlimit").val() == '' || $("#qlimit").val().match(/^[0-9]+$/) ) {
				tapView.fireUpdateQueryEvent();			
			} else {
				loggedAlert('The result limit must be a positive integer value' , "User Input Error");
				$("#qlimit").val(100);
				tapView.fireUpdateQueryEvent();			
				return false;
			}

		});

		/*********************************************************************************************
		 * Query form setup
		 */
		$("#taptab").tabs();
		$("#taptab").tabs({
			unselect : true
		});
		$("#tapconstraintlist").droppable({
			drop: function(event, ui){
				tapView.fireAttributeEvent(ui.draggable);		
			}
		});
		$("#tapselectlist").droppable({
			drop: function(event, ui){
				tapView.fireSelectEvent(ui.draggable);		
			}
		});
		$("#taporderby").droppable({
			drop: function(event, ui){
				tapView.fireOrderByEventEvent(ui.draggable);		
			}
		});
		$("#tapalpha").droppable({
			drop: function(event, ui){
				tapView.fireAlphaEvent(ui.draggable);		
			}
		});
		$("#tapdelta").droppable({
			drop: function(event, ui){
				tapView.fireDeltaEvent(ui.draggable);		
			}
		});
		/*
		 * Coordinates input
		 */
		$("#tapwhere input").keypress(function(event) {
			if (event.which == '13') {
				tapView.fireInputCoordEvent();
			}
		});
		/*
		 * Name resolver buton activation
		 */
		$(".sesame").click(function() {
			var inputfield = $(this).parents('div').find(".coordinputvalue");
			showProcessingDialog("Waiting on SESAME response");
			$.getJSON("sesame", {object: inputfield.val() }, function(data) {
				hideProcessingDialog();
				if( processJsonError(data, "Sesame failure") ) {
					return;
				}
				else {
					inputfield.val(data.alpha + ' ' + data.delta);
				}
			});
		});
		/*
		 * This callback can be changed changed at everytime: do not use the "onclick" HTML  
		 * attribute which is not overriden by JQuery "click" callback
		 */
		$('#showquerymeta').click(function(){loggedAlert("No meta data available yet", 'Application not Ready');});
		tapView.fireRefreshJobList();
	}
	this.initSamp = function() {
		sampView.fireSampInit();
	}
};


var whenReady = new initFunctions ();