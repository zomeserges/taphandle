jQuery.extend({

	CartView: function(jid){
		/**
		 * keep a reference to ourselves
		 */
		var that = this;

		/**
		 * datatables references
		 */
		var folderTables = new Array();
		/**
		 * who is listening to us?
		 */
		var listeners = new Array();
		/**
		 * add a listener to this view
		 */
		this.addListener = function(list){
			listeners.push(list);
		};
		
		var aborted = false;

		this.fireAddJobResult = function(dataTreePath, jobid) {
			Processing.show("Result of job " + dataTreePath + "." + jobid + " added to the cart");
			aborted = false;
			$.each(listeners, function(i){
				listeners[i].controlAddJobResult(dataTreePath, jobid);
			});
			this.resetJobControl();
			Processing.hide();
			};
		this.fireRemoveJobResult = function(nodekey, jobid) {
			aborted = false;
			$.each(listeners, function(i){
				listeners[i].controlRemoveJobResult(nodekey, jobid);
			});
			this.resetJobControl();
		};
		this.fireAddUrl = function(nodekey, url) {
			Processing.show("Data returned by " + url + " added to the cart");
			aborted = false;
			$.each(listeners, function(i){
				listeners[i].controlAddUrl(nodekey, url);
			});
			Processing.hide();
			this.resetJobControl();
		};
		this.fireRemoveUrl = function(nodekey, url) {
			aborted = false;
			$.each(listeners, function(i){
				listeners[i].controlRemoveUrl(nodekey, url);
			});
			this.resetJobControl();
		};
		this.fireRestrictedUrl = function(nodekey, url) {
			ModalInfo.info("Restricted Access", "Shopping cart facility does not support URL with a restricted access.");
		};
		this.fireOpenCart = function() {			
			$.each(listeners, function(i){
				listeners[i].controlOpenCart();
			});
		};
		this.fireCleanCart = function(tokens) {
			aborted = false;
			$.each(listeners, function(i){
				listeners[i].controleCleanCart(tokens);
			});
			this.resetJobControl();
		};
		this.fireStartArchiveBuilding = function() {
			$.each(listeners, function(i){
				listeners[i].controlStartArchiveBuilding();
			});
		};
		this.fireKillArchiveBuilding = function() {
			$.each(listeners, function(i){
				listeners[i].controlKillArchiveBuilding();
			});
		};
		this.fireArchiveDownload = function() {			
			$.each(listeners, function(i){
				listeners[i].controlArchiveDownload();
			});
		};
		this.fireGetJobPhase = function() {
			var retour=null;
			$.each(listeners, function(i){
				retour = listeners[i].controlGetJobPhase();
			});
			return retour;
		};
		this.fireChangeName = function(nodekey, dataType, rowNum, newName){
			$.each(listeners, function(i){
				listeners[i].controlChangeName(nodekey, dataType, rowNum, newName);
			});			
			this.resetJobControl();
		};
		this.resetJobControl= function() {
			Out.info("resetJobControl");
			$.each(listeners, function(i){
				listeners[i].controlResetZipjob();
			});			
			$('.zip').css("border", "0px");
			$('#detaildiv_download').attr("disabled", true);
			$('#detaildiv_submit').removeAttr("disabled");
			var jobspan = $('#cartjob_phase');
			jobspan.attr('class', 'nojob');
			jobspan.text('nojob');
			};
		
		this.fireCheckArchiveCompleted = function() {
			if (!aborted) {
				var phase = that.fireGetJobPhase();
				var jobspan = $('#cartjob_phase');
				jobspan.attr('class', phase.toLowerCase());
				jobspan.text(phase);
				if( phase == 'nojob') {
					$('.zip').css("border", "0px");
				}
				else if( phase == 'EXECUTING') {
					$('.zip').css("border", "2px solid orange");
					setTimeout("cartView.fireCheckArchiveCompleted();", 1000);
				}
				else if( phase == 'COMPLETED') {
					$('.zip').css("border", "2px solid green");
					$('#detaildiv_submit').attr("disabled", true);
					$('#detaildiv_download').removeAttr("disabled");
				}
				else {
					$('.zip').css("border", "2px solid red");
				}
			}
			else {
				$('.zip').css("border", "2px solid green");
				$('#detaildiv_submit').attr("disabled", true);
				$('#detaildiv_download').removeAttr("disabled");
			}
		};

		this.initForm = function(cartData) {
			$('#detaildiv').remove();
			if ($('#detaildiv').length == 0) {
				$(document.documentElement).append(
				"<div id=detaildiv style='width: 99%; display: none;'></div>");
			}
			var empty = true;
			for( var nodekey in cartData) {
				empty = false;
				break;
			}			
			if( empty ) {
				Modalinfo.info("Empty Shopping Cart");
				return;
			}

			var table = '';
			//var phase = that.fireGetJobPhase();

			//table += '<h2><img src="images/groscaddy.png"> Shopping Cart</h2>';
			table += '<div id=table_div></div>';
			table += "<p id=\"cartjob\" class='chapter'> <img src=\"images/tdown.png\">Processing status</p>";
			//table += '<br><span>Current Job Status</span> <span id=cartjob_phase class="' + phase.toLowerCase() + '">' + phase + '</span><BR>';
			table += '<br><span>Current Job Status</span> <span id=cartjob_phase class=""></span><BR>';
			table += "<span>Manage Content</span> <input type=button id=detaildiv_clean value='Remove Unselected Items'>";			
			table += "<input type=button id=detaildiv_cleanall value='Remove All Items'><br>";			
			table += "<span>Manage Job</span> <input type=button id=detaildiv_submit value='Start Processing'>";			
			table += "<input type=button id=detaildiv_abort value='Abort'><br>";			
			table += "<span>Get the Result</span> <input type=button id=detaildiv_download value='Download Cart' disabled='disabled'>";			

//			$('#detaildiv').html(table);
//			var modalbox = $('#detaildiv').modal();
//			$("#simplemodal-container").css('height', 'auto'); 
//			$("#simplemodal-container").css('width', 'auto'); 
//			$(window).trigger('resize.simplemodal'); 
			
			Modalinfo.dataPanel('<a class="zip-title" href="#"></a> Shopping Cart' , table, null, "white");		
			this.setTableDiv(cartData);

			$('#detaildiv_clean').click( function() {
				var tokenArray =new Array();
				for( var i=0 ; i<folderTables.length ; i++) {
					tokenArray[tokenArray.length]  = $('input',folderTables[i].fnGetNodes()).serialize();
				}
				that.fireCleanCart(tokenArray);
				return false;
			} );
			$('#detaildiv_cleanall').click( function() {
				that.fireCleanCart("");
				Modalinfo.close($(this).parent().attr("id"));
				return false;
			} );
			$('#detaildiv_submit').click( function() {
				aborted = false;
				that.fireStartArchiveBuilding();
				return false;
			} );
			$('#detaildiv_abort').click( function() {
				if (aborted == false) {
					aborted = true;
					that.fireKillArchiveBuilding();
					//that.fireCheckArchiveCompleted();
				}
				return false;
			} );

			$('#detaildiv_download').click( function() {
				that.fireArchiveDownload();
				$('.zip').css("border", "0px");
				return false;
			} );
			this.fireCheckArchiveCompleted();
		};
		
		this.setTableDiv= function(cartData) {
			folderTables = new Array();
			var table = '';
			var empty = true;
			for( var nodekey in cartData) {
				empty = false;
				break;
			}			
			if( empty ) {
				Modalinfo.info("Empty Shopping Cart");
				$.modal.close();
				return;
			}
			for( var nodekey in cartData) {
				table += "<p id=\"mappedmeta\" class='chapter'> <img src=\"images/tdown.png\">Node  " + nodekey + " </p>";
				table += "<div class='detaildata'>";
				table += "<table width=99% cellpadding=\"0\" cellspacing=\"0\" border=\"0\"  id=\"folder_" + nodekey +"\" class=\"display\"></table>";
				table += "</div>";
			}
			$('#table_div').html(table);
			for( var nodekey in cartData) {
				var folder = cartData[nodekey];
				var tableId = "folder_" + nodekey;
				var aaData = new Array();
				for( var i=0 ; i<folder.jobs.length ; i++) {
					aaData[aaData.length] = ["<INPUT TYPE=CHECKBOX checked name=\"" + nodekey + " job " + i + "\" value=" + i +">"
					                         , "Job", "<span>" + folder.jobs[i].name + "</span>", folder.jobs[i].uri];
				}
				for( var i=0 ; i<folder.urls.length ; i++) {
					aaData[aaData.length] = ["<INPUT TYPE=CHECKBOX checked name=\"" + nodekey + " url " + i + "\" value=" + i +">"
					                         ,  "URL", "<span>" + folder.urls[i].name + "</span>", folder.urls[i].uri];
				}
				
				var options = {
					"aoColumns" : [{sTitle: "Keep/Discard"}, {sTitle: "Data Source"},{sTitle: "Resource Name"},{sTitle: "Resource URI"}],
					"aaData" : aaData,
					"bPaginate" : false,
					"bInfo" : false,
					"aaSorting" : [],
					"bSort" : false,
					"bFilter" : false,
					"bAutoWidth" : true,
					"bDestroy": true
				};
				
				folderTables[folderTables.length] = CustomDataTable.create(tableId, options);
				
//				folderTables[folderTables.length] = $('#folder_' + nodekey).dataTable(
//						{
//							"aoColumns" : [{sTitle: "Keep/Discard"}, {sTitle: "Data Source"},{sTitle: "Resource Name"},{sTitle: "Resource URI"}],
//							"aaData" : aaData,
//							"bPaginate" : false,
//							"bInfo" : false,
//							"aaSorting" : [],
//							"bSort" : false,
//							"bFilter" : false,
//							"bAutoWidth" : true,
//							"bDestroy": true
//						});
				
				var oTable = folderTables[folderTables.length-1];
			    /* Apply the jEditable handlers to the table */
			    $('span', oTable.fnGetNodes()).editable( 
			    	function(data) {
			    		return data.replace(/[^\w]/g, "_");
			    		},
			    	{        
			    	 "callback": function( sValue, y ) {
				        var node = $(this).parent().get(0);
			            var aPos = oTable.fnGetPosition( node );
			            var row = aPos[0];
			            var type = oTable.fnGetData( row )[1];
			            /*
			             * jobs and urls are mixed in a table.
			             * We must retreive th position within the correct type
			             */
			            var cpt = -1;
			            for( var i=0 ; i<=row ; i++ ){
			            	if(  oTable.fnGetData( i )[1] == type) {
			            		cpt++;
			            	}
			            }
			            cartView.fireChangeName(nodekey, type, cpt, sValue);
			    	  },
			        "height": "1.33em", 
			        "width": "16em"}
			    );
			    Modalinfo.center();
			}	
		};
	}
});