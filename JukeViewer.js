//Link2006's SnitchViewer / JaViewer / JukeViewer 
//Version 1.0
//Released publicly 12/24/2023
//
//Happy Holidays!

//Install this Script on a Key event to reset the 3D Previews 
//Install this script on RecvMessage Event to activate jukealert

//What this does is preview when a JukeAlert is received when doing /jainfo
//This should help preview the changes in blocks recorded by a jukebox.

//Changelog:
//0.1
//	*Initial Version
//0.2
//	+Added text in blocks to identify changes by which player 
//	with a number to identify the order the script found them.
//
//1.0
//	+Fixed the ordering of boxes, optimised draw3D/addBox usage
//	+Improved text to render on both sides, rendering from the top instead.
//	+Changed linenum to a timestamp
//			(0:Placed by Link2006) -> (1970-01-01T12:34:56 : Place Link2006)
//	*Fixed ordering of text to not have empty lines
//	(This was done by switching a single incremental number to a json object stored in a string)
//	

//Current Issues:
//	Text may be hard to read, not sure how i can fix that...

//Currently Supported JA Events: Place,Break,Opened
//I'm not sure if i've missed any other events that are relevent.

//Please note the code is not that clean, as there was quite a bit of rework to make this function properly.

var objActionsJSON = GlobalVars.getString('link2006.objActions'); //Gets the JSON'd Object for blocks, let's us store which Y position we're at for each block.
if(objActionsJSON === null){
	objActionsJSON = "{}"; //New object if it's empty/missing
}
var objActions = JSON.parse(objActionsJSON); //Parse it into an object

if(event.getEventName()=="RecvMessage"){
	//This regex matches a line that contains "123 -32 -456" and only gets that  
	const coordsRE = /(-?\d+) (-?\d+) (-?\d+)/g; //Is this gonna work? 
	var msg = event.text.getStringStripFormatting(); 
		
	function simpleAddBox(draw3d,x,y,z,color,text)  //Lol
	{
		//Simplifies adding a box for me in the chat parsing
		/*
		Object.keys(objActions).forEach(function(key) {
			console.log(key + ': ' + objActions[key]);
		  });
		*/

		//Verify if we have a box where we're creating one...
		var boxList = draw3d.getBoxes();
		var boxExists = false; //Keep track if it was already found.
		boxList.forEach(element => {
			//This may look bad but w/e
			if(element.pos.getX1()==x & element.pos.getY1()==y & element.pos.getZ1() == z){
				if(element.pos.getX2()==x+1 & element.pos.getY2()==y+1 & element.pos.getZ2() == z+1){
					boxExists = true;
				}
			}
		});
		//Is there already a box here? If so, then a newer action was recorded here.
		if(!boxExists)
		{
			//Otherwise, create a new box.
			draw3d.addBox(x,y,z,x+1,y+1,z+1,color,color,false);
		}

		if(text!==undefined) //If the text is not undefined...
		{
			//Add text to the block. 
			//			  text,   x y color    shadow
			//var linenum = -GlobalVars.getInt("link2006.linecnt"); 
			var linenum = objActions[x+"_"+"_"+y+"_"+z];
			/*
			console.log(linenum);
			console.log(x+"_"+"_"+y+"_"+z);
			*/
			
			if (linenum === undefined) {
				linenum = 0 //Making sure this doesn't break anything else
			}
			
			/*
			var linenum = -GlobalVars.getInt("link2006.linecnt"); 
			new2d.addText(linenum + ": "+text,0,GlobalVars.getAndDecrementInt("link2006.linecnt")*10,color,true);
			*/
			objActions[x+"_"+"_"+y+"_"+z] = linenum + 1;
			//GlobalVars.putString("link2006.objActions",objActions);
			//new2d.addText(linenum + ": "+text,0,linenum*10,color,true);
			var front2D = draw3d.addDraw2D(x,y+1,z+1,0,0,0);
			var back2D = draw3d.addDraw2D(x+1,y+1,z,0,180,0);
			//Those are weirdly name because i'm bad at 3D and at naming variables.
			var SideA2D = draw3d.addDraw2D(x+1,y+1,z+1,0,90,0);
			var SideB2D = draw3d.addDraw2D(x,y+1,z,0,270,0);
			front2D.addText(text,0,linenum*10,color,true);
			back2D.addText(text,0,linenum*10,color,true);
			SideA2D.addText(text,0,linenum*10,color,true);
			SideB2D.addText(text,0,linenum*10,color,true);
			//Update the global var here 
			GlobalVars.putString("link2006.objActions",JSON.stringify(objActions));
		}
	}
	
	var snitchAction = msg.split(" "); //Give an Array out of the chat we got, see if it's a jukealert ping.
	if(snitchAction[0]=="Place" || snitchAction[0]=="Break" || snitchAction[0]=="Opened"){ //If it's a JukeAlert event
		//var draw3d = Hud.createDraw3D(); 
		//If there's already a draw3D, re-use it (this helps clean up rendering + search for existing boxes)
		var list3D = Hud.listDraw3Ds();
		draw3d=list3D[0]; //Get the first available draw3D, re-use it for my boxes
		if(draw3d === undefined){
			draw3d = Hud.createDraw3D(); //There is no existing Draw3D, create a new one.
		}

		//				X					Y					Z
		var coordsStr = snitchAction[4]+" "+snitchAction[5]+" "+snitchAction[6] 
		var coords = coordsStr.match(coordsRE); //Get the coords from the RegEx 
		//coords = coords[0].match(/(-?\d+) (-?\d+) (-?\d+)/g); //UNUSED, Was removing Brackets here but optimised away now.
		coords = coords[0].split(" "); //Turn this into an array again!
		if(snitchAction[0]=="Place"){	//X						Y					Z					TIMESTAMP					USERNAME
			simpleAddBox(draw3d,parseInt(coords[0]),parseInt(coords[1]),parseInt(coords[2]),0x00FF00,snitchAction[7]+": Place "+snitchAction[2])
		}
		else if(snitchAction[0]=="Break"){
			simpleAddBox(draw3d,parseInt(coords[0]),parseInt(coords[1]),parseInt(coords[2]),0xFF0000,snitchAction[7]+": Break "+snitchAction[2])
		}
		else if(snitchAction[0]=="Opened"){
			simpleAddBox(draw3d,parseInt(coords[0]),parseInt(coords[1]),parseInt(coords[2]),0xFFFF00,snitchAction[7]+": Open "+snitchAction[2])
		}
		draw3d.register(); //Register the new 3D Blocks for rendering...  
	}
	
}
else if(event.getEventName()=="Key"){
	Chat.log("Clearing JukeAlert Previews and resetting global vars...");
	Hud.clearDraw3Ds()
	//GlobalVars.putInt("link2006.linecnt",0);
	GlobalVars.remove("link2006.objActions"); //clean the object entirely.
	//objActions = {}
}
