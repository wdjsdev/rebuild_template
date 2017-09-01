/*



Script Name: Adjust Template
Author: William Dowling
Build Date: 22 September, 2016
Description: Reposition all prepress pieces. use library object for one off prepress fixes/adjustments
Build number: 1.0

Progress:

	Version 1.001
		21 September, 2016
		initial build.
			very simple, just update the library object with new coordinates
			choose whether to execute once or to loop all documents

	Version 1.002
		21 October, 2016
		removed library object and replaced with included central library for more universal operation.

	Version 1.003
		28 October, 2016
		Added prompt to determine whether to batch all open documents or just do the current one.

	Version 1.004
		16 January, 2017
		Adding a prompt dialog to allow the user to determine the correct left to right order of the pieces
		Added condition to accommodate regular/raglan distinctions for slowpitch uniforms.

	Version 1.006
		01 January, 2017
		Add a dialog that asks user whether the pieces need to be named or whether the pieces are already named properly.
			if pieces are properly named, skip the sort function and simply put the pieces back where they belong.
		Altering the line of code that determines the code of the garment to make it more robust

	Version 1.007
		27 February, 2017
		Added a condition to flip the outside cowl pieces for football jerseys.

	Version 1.008
		27 February, 2017
		Adding logic to remove artwork from artwork layers so the template will be nice and clean for use later.

	Version 1.009
		28 February, 2017
		Fixed logic that removes artwork. had some bad variable definitions in there that was causing silent errors.

	Version 1.010
		02 March, 2017
		Added a check to make sure the garment exists in the build_template_library.
		Alert the user and exit script if not.

	Version 1.011
		27 March, 2017
		Fixed an issue that caused garment code to be improperly calculated
		if the garment code had an _A appended to the layer name.
*/

function container()
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




	////////End//////////
	///Logic Container///
	/////////////////////

	/*****************************************************************************/

	///////Begin////////
	////Data Storage////
	////////////////////

	//local storage for development only
	// #include "~/Desktop/automation/javascript/_new_cad_workflow/central_library/build_template_library.js";

	//network storage for production version of script

	if($.os.match('Windows')){
		//PC
		eval("#include \"N:\\Library\\Scripts\\Script Resources\\Data\\build_template_library.js\"");
		
	} else {
		// MAC
		eval("#include \"/Volumes/Customization/Library/Scripts/Script Resources/Data/build_template_library.js\"");
	}




	////////End/////////
	////Data Storage////
	////////////////////

	/*****************************************************************************/

	///////Begin////////
	///Function Calls///
	////////////////////

	var docRef = app.activeDocument;
	var layers = docRef.layers;
	var prepress = layers[0].layers["Prepress"];
	var garLayName = layers[0].name;
	var artLayers = layers[0].layers["Artwork Layer"];

	// var styleNum = layers[0].name.substring(layers[0].name.lastIndexOf("_")+1,layers[0].name.length);

	// var code = layers[0].name.substring(0,layers[0].name.indexOf("_0"));

	var pat1 = /_[a-zA-Z]{1,2}$/
	var pat2 = /_\d{3,4}$/
	

	if(pat1.test(garLayName))
	{
		//this garment layer name has a trailing letter, likely to distinguish between inside and outside of a reversible jersey
		//to get the correct code, you need to trim the trailing letter and then the style number

		//trim off the trailing _A or similar so the string contains the code and style number
		var code = garLayName.substring(0, garLayName.lastIndexOf("_"))

		//trim off the style number so you're left with the correct code.
		code = garLayName.substring(0, code.lastIndexOf("_"))
	}

	else if(pat2.test(garLayName))
	{
		//this garment layer name ends with the style number
		//to get the correct code you need to simply trim the _000 from the end.
		var code = garLayName.substring(0, garLayName.lastIndexOf("_"))
	}


	if(!templateInfo[code])
	{
		alert("That code wasn't found in the library.\nPlease let William know about this issue.\nSend the correct bm code and old garment code if possible, eg. FD_FAST_2B");
		return false;
	}

	var library = templateInfo[code]["placement"];

	
	if(library["Regular"] != undefined)
	{
		//commenting this generic prompt in favor of a
		//more robust scriptUI
		// var regRag = prompt("Regular or Raglan?", "");
		var regRag = regRagPrompt(library);
		if(!regRag)
		{
			alert("You cancelled the script. Exiting.");
			return;                                                                           
		}
		library = library[regRag];
	}
	var libPieces = templateInfo[code]["pieces"];

	var renamePieces = false;

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
	w.show();

	prepress.visible = true;

	if (renamePieces)
	{
		var pieces = leftToRightOrderPrompt(code,libPieces)


		if(pieces == null)
		{
			return;
		}

		prepress.visible = true;

		for(var a=0;a<prepress.layers.length;a++)
		{
			var curSize = prepress.layers[a].name;
			var groups = [];
			for(var g=0;g<prepress.layers[a].groupItems.length;g++)
			{
				var thisGroup = prepress.layers[a].groupItems[g];
				groups.push(thisGroup);
			}
			var theItems = leftRightSort(groups);
			for(var b=0;b<theItems.length;b++)
			{
				var curItem = theItems[b];
				curItem.name = curSize + " " + pieces[b];
				var thisName = curItem.name;

				//if there is a regular/raglan distinction
				// var l = library["Raglan"][curSize][curItem.name][0];
				// var t = library["Raglan"][curSize][curItem.name][1];

				//if there is no reg/rag distinction

				//check if this piece is an outside cowl.
				//if so, rotate it 180 degrees
				if(thisName.indexOf("Outside Cowl")>-1)
				{
					thisItem.rotate(180);
				}

				var l = library[curSize][curItem.name][0];
				var t = library[curSize][curItem.name][1];			
				curItem.left = l;
				curItem.top = t;
			}
		}
	}
	else
	{
		for(var a=0;a<prepress.layers.length;a++)
		{
			var thisLay = prepress.layers[a];
			coords = library[thisLay.name];
			for(var b=0;b<thisLay.groupItems.length;b++)
			{
				var thisItem = thisLay.groupItems[b];
				var thisName = thisItem.name;

				//check if this piece is an outside cowl.
				//if so, rotate it 180 degrees
				if(thisName.indexOf("Outside Cowl")>-1)
				{
					thisItem.rotate(180);
				}
				$.writeln("moving " + thisName + " to [" + coords[thisName][0] + "," + coords[thisName][1] + "]");
				
				thisItem.left = coords[thisName][0];
				thisItem.top = coords[thisName][1];
			}
		}
	}


	prepress.visible = false;	


	try
	{
		layers[0].layers["Information"].locked = false;
		var comp = layers[0].layers["Information"].layers["Prepress Completed"];
		comp.remove();
		layers[0].layers["Information"].locked = true;
	}
	catch(e)
	{
		//no prepress completed indicator detected or else it couldn't be deleted for some reason..
	}

	// var styleNum = prompt("Enter style Number..");

	// layers[0].name = layers[0].name.substring(0,layers[0].name.length-3) + styleNum;


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





	////////End/////////
	///Function Calls///
	////////////////////

	/*****************************************************************************/

}
container();


//optional batch function. probably not necessary for now. So i'm leaving it commented. This script should be used for a single file unless the need arises for a batch function

// var batch = prompt("Batch all open documents or just one document?","Enter \"1\" for single document. Or enter \"all\" to batch all open documents.");

// if(batch == "all")
// {
// 	while(app.documents.length>0)
// 	{
// 		container();
// 		$.writeln(app.activeDocument.name + " completed.");
// 		app.activeDocument.close(SaveOptions.SAVECHANGES);
// 	}
// }
// else if(batch == "1")
// {
// 	container();
// }
// else
// {
// 	alert("Invalid Selection.");
// }
