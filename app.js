var MaxVariableCount=4;
var VariableNames = Array("A","B","C","D");
var Width  = Array(0,2,2,4,4);
var Height = Array(0,2,2,2,4);
var BitOrder = Array(0,1,3,2);
var AllowDontCare=false;
var DontCare = "X";

var TruthTable = Array();
var KMap = Array();
var Equation = Array();
var FunctionText = "";
var EquationHighlightColor = "#f3c256";
var Heavy = 20;

for (i=0; i<Math.pow(2,MaxVariableCount); i++)
{
    Equation[i] = new Array();
    Equation[i].ButtonUIName = "EQ" + i;
    Equation[i].Expression = "";
    Equation[i].Rect = null;
    Equation.UsedLength=0;
}

Equation.UsedLength=1;
Equation[0].Expression="0";

function InitializeTables(VarCount)
{
    TruthTable = new Array();
    KMap = new Array();                         

    VariableCount = 4;
    KMap.Width=Width[VariableCount];
    KMap.Height=Height[VariableCount];

    for (i=0; i<Math.pow(2,VariableCount); i++)
    {
        TruthTable[i] = new Array();
        TruthTable[i].Index = i;
        TruthTable[i].Name = i.toString(2);
        TruthTable[i].ButtonUIName = "TT"+TruthTable[i].Name;
        TruthTable[i].TTROWUIName = "TTROW" + TruthTable[i].Name;
        for (j=0; j<Math.pow(2,VariableCount); j++)
        {
            TruthTable[i][j] = new Array();
            TruthTable[i][j].Variable = (i & (1<<(VariableCount-(1+j)))?1:0)?true:false;
            TruthTable[i][j].Name = VariableNames[j];
            TruthTable[i][j].KMapEntry = null;
        }
    }

    KMap.XVariables = KMap.Width/2;
    KMap.YVariables = KMap.Height/2;

    for (w=0; w<KMap.Width; w++)
    {
        KMap[w]=new Array();
        for (h=0; h<KMap.Height; h++)
        {
            KMap[w][h]=new Array();
            KMap[w][h].Value = false;
            mapstr = BinaryString(BitOrder[w],KMap.XVariables) + BinaryString(BitOrder[h],KMap.YVariables);
            mapval = parseInt(mapstr,2);
            KMap[w][h].TruthTableEntry = TruthTable[mapval];
            KMap[w][h].TruthTableEntry.KMapEntry = KMap[w][h];
            KMap[w][h].ButtonUIName = "KM" + KMap[w][h].TruthTableEntry.Name;
            KMap[w][h].TDUIName = "TD" + KMap[w][h].TruthTableEntry.Name;
            KMap[w][h].Covered = false;
            KMap[w][h].Variable = new Array();
            for (i=0; i<VariableCount; i++)
            {
                KMap[w][h].Variable[i] = KMap[w][h].TruthTableEntry[i].Variable;
            }
        }
    }

    FunctionText = "Funzione(";
    for (i=0; i<VariableCount; i++)
    {
        FunctionText += VariableNames[i];
    }
    FunctionText+="):";
}

function HighlightColor( Value )
{
    if (Value=="1") return "#005F6A";
    if (Value=="0") return "#000000";
    return "gred";
}

function RectHighlightColor()
{
    return EquationHighlightColor;
}

window.onload = ChangeVariableNumber;

function CreateRect( x,y,w,h )
{
    var Obj=new Array();
    Obj.x = x;
    Obj.y = y;
    Obj.w = w;
    Obj.h = h;
    return Obj;
}

function Compare( Value1, Value2 )
{
    if ( (Value1 == Value2) || (Value1==DontCare) || (Value2==DontCare) )
    {
        return true;
    }
    else
    {
        return false;
    }
}

function TestRect( Rect, TestValue )
{
    var dx=0;
    var dy=0;
    for (dx=0; dx<Rect.w; dx++)
    {
        for (dy=0; dy<Rect.h; dy++)
        {
            var Test = KMap[(Rect.x+dx)%KMap.Width][(Rect.y+dy)%KMap.Height].Value;
            if (!Compare(TestValue,Test))
            {
                return false;
            }
        }
    }
    return true;
}

function IsCovered( Rect )
{
    var dx=0;
    var dy=0;
    for (dx=0; dx<Rect.w; dx++)
    {
        for (dy=0; dy<Rect.h; dy++)
        {
            if (!KMap[(Rect.x+dx)%KMap.Width][(Rect.y+dy)%KMap.Height].Covered) 
            {
                if (!(KMap[(Rect.x+dx)%KMap.Width][(Rect.y+dy)%KMap.Height].Value==DontCare))
                {
                    return false;
                }
            }
        }
    }
    return true;
}

function Cover( Rect, IsCovered )
{
    var dx=0;
    var dy=0;
    for (dx=0; dx<Rect.w; dx++)
    {
        for (dy=0; dy<Rect.h; dy++)
        {
            KMap[(Rect.x+dx)%KMap.Width][(Rect.y+dy)%KMap.Height].Covered = IsCovered;
        }
    }
}

function SearchRect( w,h, TestValue, Found, DoCover )
{
    if ((w>KMap.Width) || (h>KMap.Height))
    {
        return;
    }
        
    var x=0;
    var y=0;
    var across = (KMap.Width==w) ?1:KMap.Width;
    var down   = (KMap.Height==h)?1:KMap.Height;
    for (x=0; x<across; x++)
    {
        for (y=0; y<down; y++)
        {
            var Rect = CreateRect(x,y,w,h);
            if (TestRect(Rect,TestValue))
            {
                if (!IsCovered(Rect))
                {
                    Found[Found.length]=Rect;
                    if (DoCover) Cover(Rect, true);
                }
            }
        }
    }
}

function TryRects(Rects,Used)
{
    var j = 0;
    for (j = 0; j < Rects.length; j++)
    {
        var Rect = Rects[j];
        if (TestRect(Rect, true))
        {
            if (!IsCovered(Rect))
            {
                Used[Used.length] = Rect;
                Cover(Rect, true);
            }
        }
    }
}

function AddRectWeight(Weights, Rect, Weight)
{
    var dx = 0;
    var dy = 0;
    for (dx = 0; dx < Rect.w; dx++)
    {
        for (dy = 0; dy < Rect.h; dy++)
        {
            Weights[(Rect.x + dx) % KMap.Width][(Rect.y + dy) % KMap.Height] += Weight;
        }
    }
}

function GetRectWeight(Weights, Rect)
{
    var dx = 0;
    var dy = 0;
    var W = 0;
    for (dx = 0; dx < Rect.w; dx++)
    {
        for (dy = 0; dy < Rect.h; dy++)
        {
            W += Weights[(Rect.x + dx) % KMap.Width][(Rect.y + dy) % KMap.Height];
        }
    }
    return W;
}

function SortByWeight(a, b)
{
    if (a.Weight < b.Weight) return -1;
    else if (a.Weight > b.Weight) return 1;
    else return 0;
}

function OverlappingRects(R1,R2)
{
    if ( (R1.x+R1.w>R2.x) && 
         ((R2.x+R2.w)>(R1.x)) &&
         (R1.y+R1.h>R2.y) && 
         ((R2.y+R2.h)>(R1.y))
        )
        return true;
    return false;
}

function FindBestCoverage(Rects,AllRects)
{
    var Weights = new Array();
    for (w = 0; w < KMap.Width; w++)
    {
        Weights[w] = new Array();
        for (h = 0; h < KMap.Height; h++)
        {
            Weights[w][h] = (KMap[w][h].Covered)?Heavy:0;
        }
    }

    var i = 0;
    for (i = 0; i < Rects.length; i++)
    {
        AddRectWeight(Weights, Rects[i], 1);
    }

    var SortedRects = new Array();
    while (Rects.length>0)
    {
        var j=0;
        for (j = 0; j < Rects.length; j++)
        {
            Rects[j].Weight = GetRectWeight(Weights, Rects[j]);
        }
        
        Rects.sort(SortByWeight);
        SortedRects.push(Rects[0]);
        if (Rects.length == 1)
        {
            break;
        }
        
        AddRectWeight(Weights, Rects[0], Heavy);
        
        for (j=0; j< Rects.length; j++)
        {
            if (OverlappingRects(Rects[0], Rects[j]))
            {
                AddRectWeight(Weights, Rects[j], -1);
            }
        }
        
        Rects = Rects.slice(1);
    }
    
    TryRects(SortedRects, AllRects);
}

function Search()
{
    var Rects = new Array();
    Cover(CreateRect(0, 0, KMap.Width, KMap.Height), false);
    
    SearchRect(4, 4, true, Rects, true);
    SearchRect(4, 2, true, Rects, true);
    SearchRect(2, 4, true, Rects, true);
    SearchRect(1, 4, true, Rects, true);
    SearchRect(4, 1, true, Rects, true);
    SearchRect(2, 2, true, Rects, true);
    
    var Rects2x1 = new Array();
    SearchRect(2, 1, true, Rects2x1, false);
    SearchRect(1, 2, true, Rects2x1, false);
    FindBestCoverage(Rects2x1, Rects);

    SearchRect(1, 1, true, Rects, true);

    Cover(CreateRect(0, 0, KMap.Width, KMap.Height), false);
    for (i = Rects.length - 1; i >= 0; i--)
    {
        if (IsCovered(Rects[i]))
        {
            Rects[i] = null;
        }
        else
        {
            Cover(Rects[i], true);
        }
    }
    
    ClearEquation();    
    for (i=0;i<Rects.length; i++)
    {
        if (Rects[i]!=null)
        {
            RectToEquation(Rects[i]);
        }
    }
    if (Equation.UsedLength==0)
    {
        Equation.UsedLength=1;
        Equation[0].Expression="0";
        Equation[0].Rect = CreateRect(0,0,KMap.Width,KMap.Height);
    }
}

function ClearEquation()
{
    for (i=0; i<Equation.length; i++)
    {
        Equation[i].Rect    = null;
    }
    Equation.UsedLength=0;
}

function IsConstantVariable( Rect, Variable )
{
    var dx=0;
    var dy=0;
    var topleft = KMap[Rect.x][Rect.y].Variable[Variable];
    for (dx=0; dx<Rect.w; dx++)
    {
        for (dy=0; dy<Rect.h; dy++)
        {
            test = KMap[(Rect.x+dx)%KMap.Width][(Rect.y+dy)%KMap.Height].Variable[Variable];
            if (test!=topleft)
            {
                return false;
            }
        }
    }
    return true;
}

function RectToEquation( Rect )
{
    var Text = "";
    var i=0;
    for (i=0; i<VariableCount; i++)
    {
        if (IsConstantVariable( Rect, i))
        {
            if (!KMap[Rect.x][Rect.y].Variable[i])
            {
                Text += "<span style='text-decoration: overline'>"+VariableNames[i]+"</span> ";
            }
            else
            {
                Text += VariableNames[i] + " ";
            }
        }
    }
    if (Text.length==0)
    {
        Text="1";
    }
    Equation[Equation.UsedLength].Rect  = Rect;
    Equation[Equation.UsedLength].Expression = Text;
    Equation.UsedLength++;
    
    return Text;
}

function DisplayValue( bool )
{
    if (bool==true)
    {
        return "1";
    }
    else if (bool==false)
    {
        return "0";
    }
    else return DontCare;
}

function BinaryString( value, bits )
{
    var str = value.toString(2);
    var i=0;
    for (i=0; i<bits; i++)
    {
        if (str.length<bits)
        {
            str = "0" + str;
        }
    }
    return str;
}

function UpdateUI()
{
    var i = 0;
    for (i = 0; i < TruthTable.length; i++)
    {
        var Val = DisplayValue(TruthTable[i].KMapEntry.Value);
  
        SetValue(TruthTable[i].ButtonUIName, Val);
        SetBackgroundColor(TruthTable[i].ButtonUIName, HighlightColor(Val));
        SetBackgroundColor(TruthTable[i].TTROWUIName, HighlightColor(Val));

        SetValue(TruthTable[i].KMapEntry.ButtonUIName, Val);
        SetBackgroundColor(TruthTable[i].KMapEntry.ButtonUIName, HighlightColor(Val));
        SetBackgroundColor(TruthTable[i].KMapEntry.TDUIName, HighlightColor(Val));
    }
    SetInnerHTML("EquationDiv", GenerateEquationHTML());
}
    
function ToggleValue( Value )
{
    if (AllowDontCare)
    {
        if (Value==true)
        {
            return DontCare;
        }
        else if (Value==DontCare)
        {
            return false;
        }
        else if (Value==false)
        {
            return true;
        }
    }
    else
    {
        return !Value;
    }
}

function ToggleTTEntry( TTEntry )
{
    TTEntry.KMapEntry.Value = ToggleValue(TTEntry.KMapEntry.Value);
    RefreshUI();
}

function ToggleKMEntry( KMEntry )
{
    KMEntry.Value = ToggleValue(KMEntry.Value);
    RefreshUI();
}

function RefreshUI()
{
    ClearEquation();
    Search();
    UpdateUI();
}

function SetShowRect( EquationEntry, EquationIndex )
{   
    if (EquationEntry==null)
    {
        UpdateUI();
        return;
    }
    else
    {
        var ShowRect = EquationEntry.Rect;

        var dx = 0;
        var dy = 0;
        for (dx = 0; dx < ShowRect.w; dx++)
        {
            for (dy = 0; dy < ShowRect.h; dy++)
            {
                var KMEntry = KMap[(ShowRect.x + dx) % KMap.Width][(ShowRect.y + dy) % KMap.Height];
                var Val = DisplayValue(TruthTable[i].KMapEntry.Value);
                
                SetBackgroundColor(KMEntry.ButtonUIName, RectHighlightColor(Val));
                SetBackgroundColor(KMEntry.TDUIName, RectHighlightColor(Val));
                
                SetBackgroundColor(KMEntry.TruthTableEntry.ButtonUIName, RectHighlightColor(Val));
                SetBackgroundColor(KMEntry.TruthTableEntry.TTROWUIName, RectHighlightColor(Val));
            }
        }
    }
    SetBackgroundColor(Equation[EquationIndex].ButtonUIName,EquationHighlightColor);
}

function GetElement(Name)
{
    if (document.getElementById)
    {
        return document.getElementById(Name);
    }
    else if (document.all)
    {
        return document.all[Name];
    }
    else if (document.layers)
    {
        return document.layers[Name]
    }
}

function SetInnerHTML(Name,Text)
{
    GetElement(Name).innerHTML = Text
}

function SetBackgroundColor(Name,Color)
{
    GetElement(Name).style.backgroundColor = Color;
    GetElement(Name).style.color = 'white';
}

function SetValue(Name,Value)
{
    GetElement(Name).value = Value;
}

function GenerateTruthTableHTML()
{
    var Text = "<table ID=\"TruthTableID\" style=\"text-align:center\">";
    {
        Text = Text + "<thead style=\"background:rgb(255, 123, 0);text-align:center;color:black;\"><tr>";
        var i=0;
        for (i=0; i<VariableCount; i++)
        {
            Text = Text + "<th>"+VariableNames[i]+"</th>";
        }
        Text = Text + "<th>"+FunctionText+"</th></tr></thead>";
            
        for (i=0; i<TruthTable.length; i++)
        {
            if (i % 2 == 0)
            { 
                var count = 0.85;
            }else{
                var count = 0.8;
            }

            Text += "<tr ID='"+TruthTable[i].TTROWUIName+"' style=\"opacity: " +count+ "\">";  
            var j=0;
            for (j=0; j<VariableCount; j++)
            {
                if (DisplayValue(TruthTable[i][j].Variable) == 1) {
                    var color = "style=\"font-weight: bold\""
                }else{
                    var color = "";
                }

                Text = Text + "<td " + color + ">"+ DisplayValue(TruthTable[i][j].Variable)+"</td>";
            }
            Text = Text
                + "<td><input class=\"remove-bottom full-width\" ID=\""+TruthTable[i].ButtonUIName +"\" name="+TruthTable[i].ButtonUIName +" type='button' value='"+DisplayValue(TruthTable[i].KMapEntry.Value)+"' onClick=\"ToggleTTEntry(TruthTable["+i+"])\" ></td>" 
                + "</tr>";
        }
    }
    Text = Text + "</table>";
    return Text;
}

function GenerateKarnoMapHTML()
{
    var Text = "<table><thead><tr>";
    var h,w;
    Text = Text + "<th colspan=\"2\" ></th><th style=\"background:rgb(202, 91, 0);border-bottom:2px solid rgb(0, 67, 201);color:black;\" colspan="+(KMap.Width)+">";

    for (i=0; i<KMap.XVariables; i++)
    {
        Text += VariableNames[i];
    }
    
    Text += "</th></tr></thead>";
    Text += "<tbody><tr>";
    Text += "<th ></th><th style=\"border-left: none !important\"></th>";

    for (i=0; i<KMap.Width; i++)
    {
        Text += "<th class=\"header-color\" style=\"background:rgb(241, 119, 5);color:black;\">"+BinaryString(BitOrder[i],KMap.XVariables)+"</th>";
    }
    Text+="</tr>";
    
    for (h=0; h<KMap.Height; h++)
    {
        if (h % 2 != 0)
        { 
            var count = 0.85;
        }else{
            var count = 0.8;
        }
        if (h==0)
        {
            Text += "<th style=\"background:rgb(255, 148, 9);color:black; width: 15%\" rowspan="+((KMap.Height) + 2)  +">";
            for (i=0; i<KMap.YVariables; i++)
            {
                Text += "<b class=\"header-color\">" + VariableNames[i+KMap.XVariables] + "</b>";
            }
        }
        Text += "<th class=\"header-color\" style=\"border-left: 2px solid black;background:rgb(34, 12, 231);color:black;width: 15%\" >"+BinaryString(BitOrder[h],KMap.YVariables)+"</th>";

        for (w=0; w<KMap.Width; w++)
        {

            Text += "<td  ID='"+KMap[w][h].TDUIName+"' style='text-align:center;'>"
                    + "<input class=\"remove-bottom full-width\" ID="+KMap[w][h].ButtonUIName +" name="+KMap[w][h].ButtonUIName +" type='button'  value='"+DisplayValue(KMap[w][h].Value)+"' onClick=\"ToggleKMEntry(KMap["+w+"]["+h+"])\">"
                    + "</td>";
        }
        Text += "</tr>";
    }
    Text +="</td></tr></tbody></table>";
    return Text;
}

function GenerateEquationHTML()
{
    var j;
    var i;
    for (i=0; i<Equation.UsedLength; )
    {
        var Text = "<p class=\"header-color remove-bottom\">";
        for (j=0; (j < 8) && (i<Equation.UsedLength); j++)
        {
            if (i==0) Text+= "<b>"+FunctionText + " = ";
            Text += "<span class=\"blue button half-bottom\" id=\""+Equation[i].ButtonUIName + "\" onMouseOver=\"SetShowRect(Equation["+i+"],"+i+");\" onMouseOut=\"SetShowRect(null);\" style=\"padding:5px\">";
            Text += "<b>" + Equation[i].Expression + "</span>";
            if (i<Equation.UsedLength-1) Text +=" <span> + </span>";
            i++;
        }   
        Text += "</p>"
    }
    return Text;
}

function ChangeVariableNumber()
{
    InitializeTables();
    ClearEquation();
    SetInnerHTML("TruthTableDiv",GenerateTruthTableHTML());
    SetInnerHTML("KarnoMapDiv",GenerateKarnoMapHTML());
    SetInnerHTML("EquationDiv",GenerateEquationHTML());
    GetElement("FourVariableRB");
    Search();
    UpdateUI();
}

function ToggleDontCare()
{
    AllowDontCare=!AllowDontCare;
    var i=0;
    for (i=0;i<TruthTable.length; i++)
    {
        if (TruthTable[i].KMapEntry.Value==DontCare)
        {
            TruthTable[i].KMapEntry.Value=false;
        }
    }
    ChangeVariableNumber(VariableCount);
    GetElement("AllowDontCareCB").checked = AllowDontCare;
}

function PageParameter( Name )
{
    var Regex = new RegExp( "[\\?&]"+Name+"=([^&#]*)" );
    var Results = Regex.exec( window.location.href );
    if( Results != null )
    {
        return Results[1];
    }
    return "";
}

function Init()
{
    SetInnerHTML("KarnoMapDiv", GenerateKarnoMapHTML());
    SetInnerHTML("EquationDiv", GenerateEquationHTML());
    SetInnerHTML("TruthTablenDiv", GenerateTruthTableHTML());
}
