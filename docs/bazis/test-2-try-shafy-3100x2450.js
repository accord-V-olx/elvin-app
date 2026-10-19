// ELVIN -> BAZIS 10
// Project: ELVIN-TEST-2-TRY-SHAFY
// Generated only from confirmed Wardrobe Engine geometry.

function moveMin(obj, x, y, z) {
  obj.Build();
  let g = obj.GabMin;
  obj.Translate(x - g.x, y - g.y, z - g.z);
  obj.Build();
}

let KR08 = materialData.CreateButtMaterialData("Кромка 0.8", 0.8, 22, true, "KR08", 0, true, 0);
let BUM02 = materialData.CreateButtMaterialData("Бумага 0.2", 0.2, 22, true, "BUM02", 0, true, 0);

materialData.SetupActiveMaterial("ДСП 18", 18);
let P_m1_side_left = objects3d.NewPanel(630, 2432, objects3d.PanelOrientation.vertical);
P_m1_side_left.Name = "ST_L";
P_m1_side_left.TextureOrientation = panelOperations.textureOrientation.vertical;
moveMin(P_m1_side_left, 0, 0, 0);
panelOperations.AddButt(P_m1_side_left, 0, KR08);
panelOperations.AddButt(P_m1_side_left, 1, KR08);
panelOperations.AddButt(P_m1_side_left, 3, BUM02);
P_m1_side_left.Build();

let P_m1_side_right = objects3d.NewPanel(630, 2432, objects3d.PanelOrientation.vertical);
P_m1_side_right.Name = "ST_R";
P_m1_side_right.TextureOrientation = panelOperations.textureOrientation.vertical;
moveMin(P_m1_side_right, 1232, 0, 0);
panelOperations.AddButt(P_m1_side_right, 0, KR08);
panelOperations.AddButt(P_m1_side_right, 1, KR08);
panelOperations.AddButt(P_m1_side_right, 3, BUM02);
P_m1_side_right.Build();

let P_m1_top = objects3d.NewPanel(1250, 630, objects3d.PanelOrientation.horizont);
P_m1_top.Name = "KR";
P_m1_top.TextureOrientation = panelOperations.textureOrientation.horizontal;
moveMin(P_m1_top, 0, 2432, 0);
panelOperations.AddButt(P_m1_top, 0, KR08);
panelOperations.AddButt(P_m1_top, 2, BUM02);
panelOperations.AddButt(P_m1_top, 1, KR08);
panelOperations.AddButt(P_m1_top, 3, KR08);
P_m1_top.Build();

let P_m1_bottom = objects3d.NewPanel(1214, 630, objects3d.PanelOrientation.horizont);
P_m1_bottom.Name = "DNO";
P_m1_bottom.TextureOrientation = panelOperations.textureOrientation.horizontal;
moveMin(P_m1_bottom, 18, 100, 0);
panelOperations.AddButt(P_m1_bottom, 0, KR08);
panelOperations.AddButt(P_m1_bottom, 2, BUM02);
P_m1_bottom.Build();

let P_m1_shelf_1_1 = objects3d.NewPanel(596, 630, objects3d.PanelOrientation.horizont);
P_m1_shelf_1_1.Name = "POLKA";
P_m1_shelf_1_1.TextureOrientation = panelOperations.textureOrientation.horizontal;
moveMin(P_m1_shelf_1_1, 18, 1266, 0);
panelOperations.AddButt(P_m1_shelf_1_1, 0, KR08);
panelOperations.AddButt(P_m1_shelf_1_1, 2, BUM02);
P_m1_shelf_1_1.Build();

let P_m1_partition_1 = objects3d.NewPanel(630, 2314, objects3d.PanelOrientation.vertical);
P_m1_partition_1.Name = "ST_SR";
P_m1_partition_1.TextureOrientation = panelOperations.textureOrientation.vertical;
moveMin(P_m1_partition_1, 614, 118, 0);
panelOperations.AddButt(P_m1_partition_1, 1, KR08);
panelOperations.AddButt(P_m1_partition_1, 3, BUM02);
P_m1_partition_1.Build();

let P_m1_shelf_2_1 = objects3d.NewPanel(600, 630, objects3d.PanelOrientation.horizont);
P_m1_shelf_2_1.Name = "POLKA";
P_m1_shelf_2_1.TextureOrientation = panelOperations.textureOrientation.horizontal;
moveMin(P_m1_shelf_2_1, 632, 566.4, 0);
panelOperations.AddButt(P_m1_shelf_2_1, 0, KR08);
panelOperations.AddButt(P_m1_shelf_2_1, 2, BUM02);
P_m1_shelf_2_1.Build();

let P_m1_shelf_2_2 = objects3d.NewPanel(600, 630, objects3d.PanelOrientation.horizont);
P_m1_shelf_2_2.Name = "POLKA";
P_m1_shelf_2_2.TextureOrientation = panelOperations.textureOrientation.horizontal;
moveMin(P_m1_shelf_2_2, 632, 1032.8, 0);
panelOperations.AddButt(P_m1_shelf_2_2, 0, KR08);
panelOperations.AddButt(P_m1_shelf_2_2, 2, BUM02);
P_m1_shelf_2_2.Build();

let P_m1_shelf_2_3 = objects3d.NewPanel(600, 630, objects3d.PanelOrientation.horizont);
P_m1_shelf_2_3.Name = "POLKA";
P_m1_shelf_2_3.TextureOrientation = panelOperations.textureOrientation.horizontal;
moveMin(P_m1_shelf_2_3, 632, 1499.2, 0);
panelOperations.AddButt(P_m1_shelf_2_3, 0, KR08);
panelOperations.AddButt(P_m1_shelf_2_3, 2, BUM02);
P_m1_shelf_2_3.Build();

let P_m1_shelf_2_4 = objects3d.NewPanel(600, 630, objects3d.PanelOrientation.horizont);
P_m1_shelf_2_4.Name = "POLKA";
P_m1_shelf_2_4.TextureOrientation = panelOperations.textureOrientation.horizontal;
moveMin(P_m1_shelf_2_4, 632, 1965.6, 0);
panelOperations.AddButt(P_m1_shelf_2_4, 0, KR08);
panelOperations.AddButt(P_m1_shelf_2_4, 2, BUM02);
P_m1_shelf_2_4.Build();

materialData.SetupActiveMaterial("ХДФ", 3);
let P_m1_back = objects3d.NewPanel(1246, 2346, objects3d.PanelOrientation.front);
P_m1_back.Name = "TYL";
moveMin(P_m1_back, 2, 102, -3);

materialData.SetupActiveMaterial("ДСП 18", 18);
let P_m1_facade_1_1 = objects3d.NewPanel(621, 2344, objects3d.PanelOrientation.front);
P_m1_facade_1_1.Name = "FASAD";
P_m1_facade_1_1.TextureOrientation = panelOperations.textureOrientation.vertical;
moveMin(P_m1_facade_1_1, 2, 103, 630);
panelOperations.AddButt(P_m1_facade_1_1, 0, KR08);
panelOperations.AddButt(P_m1_facade_1_1, 1, KR08);
panelOperations.AddButt(P_m1_facade_1_1, 2, KR08);
panelOperations.AddButt(P_m1_facade_1_1, 3, KR08);
P_m1_facade_1_1.Build();

let P_m1_facade_2_1 = objects3d.NewPanel(621, 2344, objects3d.PanelOrientation.front);
P_m1_facade_2_1.Name = "FASAD";
P_m1_facade_2_1.TextureOrientation = panelOperations.textureOrientation.vertical;
moveMin(P_m1_facade_2_1, 627, 103, 630);
panelOperations.AddButt(P_m1_facade_2_1, 0, KR08);
panelOperations.AddButt(P_m1_facade_2_1, 1, KR08);
panelOperations.AddButt(P_m1_facade_2_1, 2, KR08);
panelOperations.AddButt(P_m1_facade_2_1, 3, KR08);
P_m1_facade_2_1.Build();

let P_m1_plinth = objects3d.NewPanel(1214, 100, objects3d.PanelOrientation.front);
P_m1_plinth.Name = "COKOL";
moveMin(P_m1_plinth, 18, 0, 592);
panelOperations.AddButt(P_m1_plinth, 0, KR08);
P_m1_plinth.Build();

let P_m2_side_left = objects3d.NewPanel(580, 2432, objects3d.PanelOrientation.vertical);
P_m2_side_left.Name = "ST_L";
P_m2_side_left.TextureOrientation = panelOperations.textureOrientation.vertical;
moveMin(P_m2_side_left, 1250, 0, 0);
panelOperations.AddButt(P_m2_side_left, 0, KR08);
panelOperations.AddButt(P_m2_side_left, 1, KR08);
panelOperations.AddButt(P_m2_side_left, 3, BUM02);
P_m2_side_left.Build();

let P_m2_side_right = objects3d.NewPanel(580, 2432, objects3d.PanelOrientation.vertical);
P_m2_side_right.Name = "ST_R";
P_m2_side_right.TextureOrientation = panelOperations.textureOrientation.vertical;
moveMin(P_m2_side_right, 1832, 0, 0);
panelOperations.AddButt(P_m2_side_right, 0, KR08);
panelOperations.AddButt(P_m2_side_right, 1, KR08);
panelOperations.AddButt(P_m2_side_right, 3, BUM02);
P_m2_side_right.Build();

let P_m2_top = objects3d.NewPanel(600, 580, objects3d.PanelOrientation.horizont);
P_m2_top.Name = "KR";
P_m2_top.TextureOrientation = panelOperations.textureOrientation.horizontal;
moveMin(P_m2_top, 1250, 2432, 0);
panelOperations.AddButt(P_m2_top, 0, KR08);
panelOperations.AddButt(P_m2_top, 2, BUM02);
panelOperations.AddButt(P_m2_top, 1, KR08);
panelOperations.AddButt(P_m2_top, 3, KR08);
P_m2_top.Build();

let P_m2_bottom = objects3d.NewPanel(564, 580, objects3d.PanelOrientation.horizont);
P_m2_bottom.Name = "DNO";
P_m2_bottom.TextureOrientation = panelOperations.textureOrientation.horizontal;
moveMin(P_m2_bottom, 1268, 100, 0);
panelOperations.AddButt(P_m2_bottom, 0, KR08);
panelOperations.AddButt(P_m2_bottom, 2, BUM02);
P_m2_bottom.Build();

let P_m2_shelf_1 = objects3d.NewPanel(564, 580, objects3d.PanelOrientation.horizont);
P_m2_shelf_1.Name = "POLKA";
P_m2_shelf_1.TextureOrientation = panelOperations.textureOrientation.horizontal;
moveMin(P_m2_shelf_1, 1268, 566.4, 0);
panelOperations.AddButt(P_m2_shelf_1, 0, KR08);
panelOperations.AddButt(P_m2_shelf_1, 2, BUM02);
P_m2_shelf_1.Build();

let P_m2_shelf_2 = objects3d.NewPanel(564, 580, objects3d.PanelOrientation.horizont);
P_m2_shelf_2.Name = "POLKA";
P_m2_shelf_2.TextureOrientation = panelOperations.textureOrientation.horizontal;
moveMin(P_m2_shelf_2, 1268, 1032.8, 0);
panelOperations.AddButt(P_m2_shelf_2, 0, KR08);
panelOperations.AddButt(P_m2_shelf_2, 2, BUM02);
P_m2_shelf_2.Build();

let P_m2_shelf_3 = objects3d.NewPanel(564, 580, objects3d.PanelOrientation.horizont);
P_m2_shelf_3.Name = "POLKA";
P_m2_shelf_3.TextureOrientation = panelOperations.textureOrientation.horizontal;
moveMin(P_m2_shelf_3, 1268, 1499.2, 0);
panelOperations.AddButt(P_m2_shelf_3, 0, KR08);
panelOperations.AddButt(P_m2_shelf_3, 2, BUM02);
P_m2_shelf_3.Build();

let P_m2_shelf_4 = objects3d.NewPanel(564, 580, objects3d.PanelOrientation.horizont);
P_m2_shelf_4.Name = "POLKA";
P_m2_shelf_4.TextureOrientation = panelOperations.textureOrientation.horizontal;
moveMin(P_m2_shelf_4, 1268, 1965.6, 0);
panelOperations.AddButt(P_m2_shelf_4, 0, KR08);
panelOperations.AddButt(P_m2_shelf_4, 2, BUM02);
P_m2_shelf_4.Build();

materialData.SetupActiveMaterial("ХДФ", 3);
let P_m2_back = objects3d.NewPanel(596, 2346, objects3d.PanelOrientation.front);
P_m2_back.Name = "TYL";
moveMin(P_m2_back, 1252, 102, -3);

materialData.SetupActiveMaterial("ДСП 18", 18);
let P_m2_facade_1_1 = objects3d.NewPanel(596, 2344, objects3d.PanelOrientation.front);
P_m2_facade_1_1.Name = "FASAD";
P_m2_facade_1_1.TextureOrientation = panelOperations.textureOrientation.vertical;
moveMin(P_m2_facade_1_1, 1252, 103, 580);
panelOperations.AddButt(P_m2_facade_1_1, 0, KR08);
panelOperations.AddButt(P_m2_facade_1_1, 1, KR08);
panelOperations.AddButt(P_m2_facade_1_1, 2, KR08);
panelOperations.AddButt(P_m2_facade_1_1, 3, KR08);
P_m2_facade_1_1.Build();

let P_m2_plinth = objects3d.NewPanel(564, 100, objects3d.PanelOrientation.front);
P_m2_plinth.Name = "COKOL";
moveMin(P_m2_plinth, 1268, 0, 542);
panelOperations.AddButt(P_m2_plinth, 0, KR08);
P_m2_plinth.Build();

let P_m3_side_left = objects3d.NewPanel(630, 2432, objects3d.PanelOrientation.vertical);
P_m3_side_left.Name = "ST_L";
P_m3_side_left.TextureOrientation = panelOperations.textureOrientation.vertical;
moveMin(P_m3_side_left, 1850, 0, 0);
panelOperations.AddButt(P_m3_side_left, 0, KR08);
panelOperations.AddButt(P_m3_side_left, 1, KR08);
panelOperations.AddButt(P_m3_side_left, 3, BUM02);
P_m3_side_left.Build();

let P_m3_side_right = objects3d.NewPanel(630, 2432, objects3d.PanelOrientation.vertical);
P_m3_side_right.Name = "ST_R";
P_m3_side_right.TextureOrientation = panelOperations.textureOrientation.vertical;
moveMin(P_m3_side_right, 3082, 0, 0);
panelOperations.AddButt(P_m3_side_right, 0, KR08);
panelOperations.AddButt(P_m3_side_right, 1, KR08);
panelOperations.AddButt(P_m3_side_right, 3, BUM02);
P_m3_side_right.Build();

let P_m3_top = objects3d.NewPanel(1250, 630, objects3d.PanelOrientation.horizont);
P_m3_top.Name = "KR";
P_m3_top.TextureOrientation = panelOperations.textureOrientation.horizontal;
moveMin(P_m3_top, 1850, 2432, 0);
panelOperations.AddButt(P_m3_top, 0, KR08);
panelOperations.AddButt(P_m3_top, 2, BUM02);
panelOperations.AddButt(P_m3_top, 1, KR08);
panelOperations.AddButt(P_m3_top, 3, KR08);
P_m3_top.Build();

let P_m3_bottom = objects3d.NewPanel(1214, 630, objects3d.PanelOrientation.horizont);
P_m3_bottom.Name = "DNO";
P_m3_bottom.TextureOrientation = panelOperations.textureOrientation.horizontal;
moveMin(P_m3_bottom, 1868, 100, 0);
panelOperations.AddButt(P_m3_bottom, 0, KR08);
panelOperations.AddButt(P_m3_bottom, 2, BUM02);
P_m3_bottom.Build();

let P_m3_shelf_1 = objects3d.NewPanel(1214, 630, objects3d.PanelOrientation.horizont);
P_m3_shelf_1.Name = "POLKA";
P_m3_shelf_1.TextureOrientation = panelOperations.textureOrientation.horizontal;
moveMin(P_m3_shelf_1, 1868, 566.4, 0);
panelOperations.AddButt(P_m3_shelf_1, 0, KR08);
panelOperations.AddButt(P_m3_shelf_1, 2, BUM02);
P_m3_shelf_1.Build();

let P_m3_shelf_2 = objects3d.NewPanel(1214, 630, objects3d.PanelOrientation.horizont);
P_m3_shelf_2.Name = "POLKA";
P_m3_shelf_2.TextureOrientation = panelOperations.textureOrientation.horizontal;
moveMin(P_m3_shelf_2, 1868, 1032.8, 0);
panelOperations.AddButt(P_m3_shelf_2, 0, KR08);
panelOperations.AddButt(P_m3_shelf_2, 2, BUM02);
P_m3_shelf_2.Build();

let P_m3_shelf_3 = objects3d.NewPanel(1214, 630, objects3d.PanelOrientation.horizont);
P_m3_shelf_3.Name = "POLKA";
P_m3_shelf_3.TextureOrientation = panelOperations.textureOrientation.horizontal;
moveMin(P_m3_shelf_3, 1868, 1499.2, 0);
panelOperations.AddButt(P_m3_shelf_3, 0, KR08);
panelOperations.AddButt(P_m3_shelf_3, 2, BUM02);
P_m3_shelf_3.Build();

let P_m3_shelf_4 = objects3d.NewPanel(1214, 630, objects3d.PanelOrientation.horizont);
P_m3_shelf_4.Name = "POLKA";
P_m3_shelf_4.TextureOrientation = panelOperations.textureOrientation.horizontal;
moveMin(P_m3_shelf_4, 1868, 1965.6, 0);
panelOperations.AddButt(P_m3_shelf_4, 0, KR08);
panelOperations.AddButt(P_m3_shelf_4, 2, BUM02);
P_m3_shelf_4.Build();

materialData.SetupActiveMaterial("ХДФ", 3);
let P_m3_back = objects3d.NewPanel(1246, 2346, objects3d.PanelOrientation.front);
P_m3_back.Name = "TYL";
moveMin(P_m3_back, 1852, 102, -3);

materialData.SetupActiveMaterial("ДСП 18", 18);
let P_m3_facade_1_1 = objects3d.NewPanel(621, 2344, objects3d.PanelOrientation.front);
P_m3_facade_1_1.Name = "FASAD";
P_m3_facade_1_1.TextureOrientation = panelOperations.textureOrientation.vertical;
moveMin(P_m3_facade_1_1, 1852, 103, 630);
panelOperations.AddButt(P_m3_facade_1_1, 0, KR08);
panelOperations.AddButt(P_m3_facade_1_1, 1, KR08);
panelOperations.AddButt(P_m3_facade_1_1, 2, KR08);
panelOperations.AddButt(P_m3_facade_1_1, 3, KR08);
P_m3_facade_1_1.Build();

let P_m3_facade_2_1 = objects3d.NewPanel(621, 2344, objects3d.PanelOrientation.front);
P_m3_facade_2_1.Name = "FASAD";
P_m3_facade_2_1.TextureOrientation = panelOperations.textureOrientation.vertical;
moveMin(P_m3_facade_2_1, 2477, 103, 630);
panelOperations.AddButt(P_m3_facade_2_1, 0, KR08);
panelOperations.AddButt(P_m3_facade_2_1, 1, KR08);
panelOperations.AddButt(P_m3_facade_2_1, 2, KR08);
panelOperations.AddButt(P_m3_facade_2_1, 3, KR08);
P_m3_facade_2_1.Build();

let P_m3_plinth = objects3d.NewPanel(1214, 100, objects3d.PanelOrientation.front);
P_m3_plinth.Name = "COKOL";
moveMin(P_m3_plinth, 1868, 0, 592);
panelOperations.AddButt(P_m3_plinth, 0, KR08);
P_m3_plinth.Build();

let P_filler_left = objects3d.NewPanel(20, 2450, objects3d.PanelOrientation.front);
P_filler_left.Name = "PLANKA";
moveMin(P_filler_left, -20, 0, 630);
panelOperations.AddButt(P_filler_left, 0, KR08);
panelOperations.AddButt(P_filler_left, 1, KR08);
panelOperations.AddButt(P_filler_left, 2, KR08);
panelOperations.AddButt(P_filler_left, 3, KR08);
P_filler_left.Build();

let P_filler_right = objects3d.NewPanel(20, 2450, objects3d.PanelOrientation.front);
P_filler_right.Name = "PLANKA";
moveMin(P_filler_right, 3100, 0, 630);
panelOperations.AddButt(P_filler_right, 0, KR08);
panelOperations.AddButt(P_filler_right, 1, KR08);
panelOperations.AddButt(P_filler_right, 2, KR08);
panelOperations.AddButt(P_filler_right, 3, KR08);
P_filler_right.Build();

let P_filler_top_1 = objects3d.NewPanel(1250, 20, objects3d.PanelOrientation.front);
P_filler_top_1.Name = "PLANKA";
moveMin(P_filler_top_1, 0, 2450, 630);
panelOperations.AddButt(P_filler_top_1, 0, KR08);
panelOperations.AddButt(P_filler_top_1, 1, KR08);
panelOperations.AddButt(P_filler_top_1, 2, KR08);
panelOperations.AddButt(P_filler_top_1, 3, KR08);
P_filler_top_1.Build();

let P_filler_top_2 = objects3d.NewPanel(600, 20, objects3d.PanelOrientation.front);
P_filler_top_2.Name = "PLANKA";
moveMin(P_filler_top_2, 1250, 2450, 580);
panelOperations.AddButt(P_filler_top_2, 0, KR08);
panelOperations.AddButt(P_filler_top_2, 1, KR08);
panelOperations.AddButt(P_filler_top_2, 2, KR08);
panelOperations.AddButt(P_filler_top_2, 3, KR08);
P_filler_top_2.Build();

let P_filler_top_3 = objects3d.NewPanel(1250, 20, objects3d.PanelOrientation.front);
P_filler_top_3.Name = "PLANKA";
moveMin(P_filler_top_3, 1850, 2450, 630);
panelOperations.AddButt(P_filler_top_3, 0, KR08);
panelOperations.AddButt(P_filler_top_3, 1, KR08);
panelOperations.AddButt(P_filler_top_3, 2, KR08);
panelOperations.AddButt(P_filler_top_3, 3, KR08);
P_filler_top_3.Build();

// MountScheme (конфірмат + шкант) за парами деталей, що торкаються.
let Props = Action.Properties;
let Furn = Props.NewFurniture("Схема кріплення");
Furn.Click();
function M(a, b) {
  Furn.Value.MountScheme(a, b, 0, {x: 0, y: 0, z: 0});
}
M(P_m1_side_left, P_m1_top);
M(P_m1_side_right, P_m1_top);
M(P_m1_bottom, P_m1_side_left);
M(P_m1_bottom, P_m1_side_right);
M(P_m1_shelf_1_1, P_m1_side_left);
M(P_m1_shelf_1_1, P_m1_partition_1);
M(P_m1_partition_1, P_m1_top);
M(P_m1_partition_1, P_m1_bottom);
M(P_m1_shelf_2_1, P_m1_side_right);
M(P_m1_shelf_2_1, P_m1_partition_1);
M(P_m1_shelf_2_2, P_m1_side_right);
M(P_m1_shelf_2_2, P_m1_partition_1);
M(P_m1_shelf_2_3, P_m1_side_right);
M(P_m1_shelf_2_3, P_m1_partition_1);
M(P_m1_shelf_2_4, P_m1_side_right);
M(P_m1_shelf_2_4, P_m1_partition_1);
M(P_m1_plinth, P_m1_side_left);
M(P_m1_plinth, P_m1_side_right);
M(P_m1_plinth, P_m1_bottom);
M(P_m2_side_left, P_m2_top);
M(P_m2_side_right, P_m2_top);
M(P_m2_bottom, P_m2_side_left);
M(P_m2_bottom, P_m2_side_right);
M(P_m2_shelf_1, P_m2_side_left);
M(P_m2_shelf_1, P_m2_side_right);
M(P_m2_shelf_2, P_m2_side_left);
M(P_m2_shelf_2, P_m2_side_right);
M(P_m2_shelf_3, P_m2_side_left);
M(P_m2_shelf_3, P_m2_side_right);
M(P_m2_shelf_4, P_m2_side_left);
M(P_m2_shelf_4, P_m2_side_right);
M(P_m2_plinth, P_m2_side_left);
M(P_m2_plinth, P_m2_side_right);
M(P_m2_plinth, P_m2_bottom);
M(P_m3_side_left, P_m3_top);
M(P_m3_side_right, P_m3_top);
M(P_m3_bottom, P_m3_side_left);
M(P_m3_bottom, P_m3_side_right);
M(P_m3_shelf_1, P_m3_side_left);
M(P_m3_shelf_1, P_m3_side_right);
M(P_m3_shelf_2, P_m3_side_left);
M(P_m3_shelf_2, P_m3_side_right);
M(P_m3_shelf_3, P_m3_side_left);
M(P_m3_shelf_3, P_m3_side_right);
M(P_m3_shelf_4, P_m3_side_left);
M(P_m3_shelf_4, P_m3_side_right);
M(P_m3_plinth, P_m3_side_left);
M(P_m3_plinth, P_m3_side_right);
M(P_m3_plinth, P_m3_bottom);

historyOperations.CommitCurrentChanges("ELVIN-TEST-2-TRY-SHAFY");
