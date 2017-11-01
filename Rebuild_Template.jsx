function container()
{
	var valid = true;
	#include "/Volumes/Customization/Library/Scripts/Script Resources/Data/Utilities_Container.js";

	eval("#include \"/Volumes/Customization/Library/Scripts/Script Resources/Data/build_template_library.js\"");
	

	var batchFiles = [];

	function rebuild(promptForRename)
	{
		/*****************************************************************************/

		///////Begin/////////
		///Logic Container///
		/////////////////////

		function leftRightSort(groups)
		{
			var tempSorted = [];
			while(groups.length>0)
			{
				var farLeft = groups[0];
				var deleteIndex = 0;

				for(var a=0;a<groups.length;a++)
				{
					if(groups[a].left < farLeft.left)
					{
						farLeft = groups[a];
						deleteIndex = a;
					}
				}
				tempSorted.push(farLeft);
				groups.splice(deleteIndex,1)

			}

			var result = sortVert(tempSorted);

			return result;
		}

		function sortVert(thisRow)
		{
			var finishedSorting = [];
			var sortVertBuffer = 5;

			if(thisRow.length==1)
			{
				finishedSorting.push(thisRow[0]);
				return finishedSorting;
			}
			while(thisRow.length>0)
			{
				var sharedLefts = [];
				var shared = false;
				var curLeft = thisRow[0].left;
				for(var a=thisRow.length-1;a>0;a--)
				{
					var thisGroup = thisRow[a];

					if(thisGroup.left + sortVertBuffer > curLeft && thisGroup.left - sortVertBuffer < curLeft)
					{
						//this group and thisRow[0] share a left coordinate
						sharedLefts.push(thisGroup)
						shared = true;
						thisRow.splice(a,1);
					}
				}
				
				if(!shared)
				{
					finishedSorting.push(thisRow[0])
					thisRow.splice(0,1);
				}
				else
				{
					sharedLefts.push(thisRow[0]);
					thisRow.splice(0,1);

					while(sharedLefts.length>0)
					{
						var top = sharedLefts[0].top;
						var topMost = sharedLefts[0];
						var di = 0;
						for(var t = 1;t <sharedLefts.length; t++)
						{
							var thisGroup = sharedLefts[t];
							if(thisGroup.top > top)
							{
								top = thisGroup.top;
								topMost = thisGroup;
								di = t;
							}
						}
						finishedSorting.push(topMost);
						sharedLefts.splice(di,1);
					}

				}
			}
			// $.writeln("finishedSorting = " + finishedSorting);
			return finishedSorting;
		}

		//leftToRightOrderPrompt Function Description
		//create a dialog box with buttons for each shirt piece
		//user will click the button corresponding to the furthest left piece
		//dialog will close and reopen containing buttons for the remaining pieces.
		//each time the user clicks a button, the name of that piece will be pushed to an array
		//that will serve as the global "pieces" array
		function leftToRightOrderPrompt(code, shirtPieces)
		{
			var result = [];
			var btns = [];

			var cont = true;

			while(cont)
			{
				makeDialog(shirtPieces)
			}

			//makeDialog Function Description
			//create a dialog with buttons for each shirt piece
			function makeDialog(shirtPieces)
			{
				var w = new Window("dialog");
					var topText = w.add("statictext", undefined, "Click the button corresponding to the farthest left shirt piece.");
					var nextText = w.add("statictext", undefined, "When the pieces displayed are in the correct order, click \"I'm finished\"");
					var expText = w.add("statictext", undefined, "If two pieces are stacked vertically, select the top one first.");
					var hrText = w.add("statictext", undefined, "--------------------------")
					var curResult = w.add("statictext", undefined, result.join(', '))
					var hrText2 = w.add("statictext", undefined, "--------------------------")

					var btnGroup = w.add("group")
						for(var sp in shirtPieces)
						{
							makeButton(shirtPieces[sp]);
						}

					var finishedGroup = w.add("group");
						var fin = finishedGroup.add("button", undefined, "I'm Finished");
						fin.onClick = function()
						{
							cont = false;
							w.close();
						}
						var cancel = finishedGroup.add("button", undefined, "Cancel");
						cancel.onClick = function()
						{
							cont = false;
							result = null;
							w.close();
						}

					function makeButton(txt)
					{
						btns[txt] = btnGroup.add("button", undefined, txt);
						btns[txt].onClick = function()
						{
							result.push(txt);
							w.close();
						}
					}
				w.show();
			}


			return result;
		}

		//regRagPrompt Function Description
		//if a garment has multiple placement objects (typically regular and raglan)
		//we need to determine which to use. create a prompt
		//that contains a button for each possible placement object
		function regRagPrompt(obj)
		{
			var result = "";
			
			var w = new Window("dialog", "What kind of garment is this?");
				var topTxt = w.add("statictext", undefined, "What kind of garment is this?");
				var btnGroup = w.add("group");
					btnGroup.orientation = "column";

					//make the buttons
					var btns = [];
					for(var prop in obj)
					{
						makeButton(prop);
					}
					var cancelButton = btnGroup.add("button", undefined, "Cancel");
						cancelButton.onClick = function()
						{
							result = null;
							w.close();
						}
			w.show();
			

			function makeButton(txt)
			{
				btns[txt] = btnGroup.add("button", undefined, txt);
				btns[txt].onClick = function()
				{
					result = txt;
					w.close();
				}
			}
		
			return result;
		}

		function getData(code)
		{
			var result = true;

			if(templateInfo[code])
			{
				placementData = templateInfo[code]["placement"];
				libPieces = templateInfo[code]["pieces"];
			}
			else if(templateInfo[underscoreCode])
			{
				code = underscoreCode;
				placementData = templateInfo[code]["placement"];
				libPieces = templateInfo[code]["pieces"];
			}
			else
			{
				alert("The code: " + code + " wasn't found in the library.\nPlease let William know about this issue.");
				result = false;
			}

			if(placementData["Regular"] || placementData["Raglan"])
			{
				var regRag = regRagPrompt(placementData);
				if(regRag)
				{
					placementData = placementData[regRag];                                                                          
				}
				else
				{
					alert("You cancelled the script. Exiting.");
					result = false;
				}
				
			}

			return result;
		}

		function renamePiecesDialog()
		{
			var result = true;
			var w = new Window("dialog", "Did the group names get messed up?");
				var txtGroup = w.add("group");
					var txt = txtGroup.add("statictext", undefined, "Do the pieces need to be properly renamed?");
				var btnGroup = w.add("group");
					var yesButton = btnGroup.add("button", undefined, "Yes");
					yesButton.onClick = function()
					{
						renamePieces = true;
						w.close();
					}

					var noButton = btnGroup.add("button", undefined, "No");
					noButton.onClick = function()
					{
						renamePieces = false;
						w.close();
					}

					var cancel = btnGroup.add("button", undefined, "Cancel");
					cancel.onClick = function()
					{
						result = false;
						w.close();
					}
			w.show();

			return result;
		}

		function moveArt()
		{
			var result = true;

			var len = ppLay.layers.length;
			var curLay,curSize,subLen,piece,groups = [];
			for(var x=0;x<len;x++)
			{
				curLay = ppLay.layers[x];
				curSize = curLay.name;
				groups = curLay.groupItems;
				subLen = groups.length;

				for(var y=0;y<subLen && result;y++)
				{
					piece = groups[y];
					if(!piece.name)
					{
						alert("At least one group on the layer " + curSize + " is not named properly. Take a closer look.");
						result = false;
					}
					else
					{
						piece.left = placementData[curSize][piece.name][0];
						piece.top = placementData[curSize][piece.name][1];
					}
				}
			}
			return result;
		}

		function rename()
		{
			var result = true;

			var pieces = [];
			pieces = leftToRightOrderPrompt(code,libPieces);
			if(pieces)
			{
				var curLay,curSize,subLen,piece,groups = [];
				var len = ppLay.layers.length;
				for(var x=0;x<len;x++)
				{
					curLay = ppLay.layers[x];
					curSize = curLay.name;
					groups = [];
					subLen = curLay.groupItems.length;
					for(var y=0;y<subLen;y++)
					{
						groups.push(curLay.groupItems[y]);
					}
					groups = leftRightSort(groups);

					for(var y=0;y<subLen;y++)
					{
						piece = groups[y];
						piece.name = curSize + " " + pieces[y];
					}
				}
			}
			else
			{
				result = false;
			}

			return result;
		}



		////////End//////////
		///Logic Container///
		/////////////////////

		/*****************************************************************************/



		/*****************************************************************************/

		///////Begin////////
		///Function Calls///
		////////////////////

		var docRef = app.activeDocument;
		var layers = docRef.layers;
		// var ppLay = layers[0].layers["Prepress"];
		var ppLay = getPPLay(layers);
		var garLayName = layers[0].name;
		var artLayers = layers[0].layers["Artwork Layer"];
		var code,underscoreCode,placementData,libPieces,renamePieces;

		eval("#include \"/Volumes/Customization/Library/Scripts/Script Resources/Data/aa_special_instructions.js\"");


		if(valid)
		{
			code = getCode(garLayName);
			underscoreCode = code.replace("-","_");
		}
		else
		{
			valid = false;
		}

		
		if(valid && !getData(code))
		{
			valid = false;
		}

		if(promptForRename)
		{
			if(valid && !renamePiecesDialog())
			{
				valid = false;
			}
		}
		

		if(valid)
		{
			ppLay.visible = true;
		}

		if(valid && renamePieces)
		{
			valid = rename();
		}

		//check whether the pieces need to be rotated per special instructions
		if(valid && specialInstructions[code])
		{
			specialInstructions[code]("rebuild");
		}

		if(valid)
		{
			valid = moveArt();
		}

		if(valid)
		{
			ppLay.visible = false;	
		}

		if(valid)
		{
			try
			{
				layers[0].layers["Information"].locked = false;
				var comp = layers[0].layers["Information"].layers["Prepress Completed"];
				comp.remove();
				// layers[0].layers["Information"].locked = true;
			}
			catch(e)
			{
				//no prepress completed indicator detected or else it couldn't be deleted for some reason..
			}

			properTemplateSetup(docRef)
		}

		if(valid)
		{
			//remove any artwork from the artwork layers
			//so that the template will be fresh and clean for
			//building a prepress later
			try
			{
				//loop the artwork layers and delete
				//any artwork if necessary
				for(var da=0;da<artLayers.layers.length;da++)
				{
					var thisLay = artLayers.layers[da];
					if(thisLay.pageItems.length>0)
					{
						//loop the page items and delete
						//should only be one on each, but lets be safe, eh?
						for(var pi = thisLay.pageItems.length-1;pi >-1; pi--)
						{
							var thisItem = thisLay.pageItems[pi];
							thisItem.remove();
						}
					}
				}
			}
			catch(e)
			{
				//failed while deleting the artwork from the artwork layers
				//shrug. i guess just alert the user
				alert("Failed while trying to clear out the artwork layers.\nPlease double check that the art layers \
					don't have any art left on them, as this will cause an issue when trying to build a prepress later.");
				alert("e = " + e);
			}
		}





		////////End/////////
		///Function Calls///
		////////////////////

		/*****************************************************************************/

	}



	function batchPrompt()
	{
		/* beautify ignore:start */
		var w = new Window("dialog", "Current Document or All Documents?");
			var btnGroup = w.add("group");
			btnGroup.orientation = "column";
				var oneDoc = btnGroup.add("button", undefined, "Just This Document");
					oneDoc.onClick = function()
					{
						rebuild(true);
						w.close();
					}
				var getBatchDocs = btnGroup.add("button", undefined, "Open A Folder to Batch");
					getBatchDocs.onClick = function()
					{
						getFilesToBatch();
						w.close();
					}
				var cancel = btnGroup.add("button", undefined, "Cancel");
					cancel.onClick = function()
					{
						w.close();
					}
		w.show();
		/* beautify ignore:end */
	}

	function getFilesToBatch()
	{
		var batchFolder = new Folder("~/Desktop/");  
		  
		var myFolder = batchFolder.selectDlg ("Choose a folder to batch."); 

		if(myFolder)
		{
			var files = myFolder.getFiles();
			var len = files.length;

			for(var x=0;x<len;x++)
			{
				if(files[x].name.indexOf(".ait") === -1 && files[x].name.indexOf("FD") === 0 || files[x].name.indexOf("PS") === 0)
				{
					app.open(files[x]);
					batchFiles.push(app.activeDocument);
				}
			}
			if(batchFiles.length)
			{
				executeBatch();
				saveAndClose();
			}
			else
			{
				alert("No .ai files were found in the folder you selected.");
			}
		}
	}

	function executeBatch()
	{
		var len = batchFiles.length;
		for(var x=len-1;x>=0 && valid;x--)
		{
			batchFiles[x].activate();
			rebuild(false);
		}
	}

	function saveAndClose()
	{
		len = batchFiles.length;
		for(var x=len-1;x>=0;x--)
		{
			batchFiles[x].activate();
			app.executeMenuCommand("fitin");
			batchFiles[x].close(SaveOptions.SAVECHANGES);
		}
	}

	batchPrompt();
}
container();