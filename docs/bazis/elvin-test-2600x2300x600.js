// ELVIN -> BAZIS 10
// Project: ELVIN-TEST-2600x2300x600
// Generated only from confirmed Wardrobe Engine geometry.

function moveMin(obj, x, y, z) {
  obj.Build();
  let g = obj.GabMin;
  obj.Translate(x - g.x, y - g.y, z - g.z);
  obj.Build();
}

let KR08 = materialData.CreateButtMaterialData("Кромка 0.8", 0.8, 22, true, "KR08", 0, true, 0);
let BUM02 = materialData.CreateButtMaterialData("Бумага 0.2", 0.2, 22, true, "BUM02", 0, true, 0);

materialData.SetupActiveMaterial("ДСП 16", 16);
let P_side_left = objects3d.NewPanel(600, 2300, objects3d.PanelOrientation.vertical);
P_side_left.Name = "ST_L";
P_side_left.TextureOrientation = panelOperations.textureOrientation.vertical;
moveMin(P_side_left, 0, 0, 0);
panelOperations.AddButt(P_side_left, 0, KR08);
panelOperations.AddButt(P_side_left, 1, KR08);
panelOperations.AddButt(P_side_left, 2, KR08);
panelOperations.AddButt(P_side_left, 3, BUM02);
P_side_left.Build();

let P_side_right = objects3d.NewPanel(600, 2300, objects3d.PanelOrientation.vertical);
P_side_right.Name = "ST_R";
P_side_right.TextureOrientation = panelOperations.textureOrientation.vertical;
moveMin(P_side_right, 2584, 0, 0);
panelOperations.AddButt(P_side_right, 0, KR08);
panelOperations.AddButt(P_side_right, 1, KR08);
panelOperations.AddButt(P_side_right, 2, KR08);
panelOperations.AddButt(P_side_right, 3, BUM02);
P_side_right.Build();

let P_top = objects3d.NewPanel(2568, 600, objects3d.PanelOrientation.horizont);
P_top.Name = "KR";
P_top.TextureOrientation = panelOperations.textureOrientation.horizontal;
moveMin(P_top, 16, 2284, 0);
panelOperations.AddButt(P_top, 0, KR08);
panelOperations.AddButt(P_top, 2, BUM02);
P_top.Build();

let P_bottom = objects3d.NewPanel(2568, 600, objects3d.PanelOrientation.horizont);
P_bottom.Name = "DNO";
P_bottom.TextureOrientation = panelOperations.textureOrientation.horizontal;
moveMin(P_bottom, 16, 100, 0);
panelOperations.AddButt(P_bottom, 0, KR08);
panelOperations.AddButt(P_bottom, 2, BUM02);
P_bottom.Build();

let P_shelf_1_1 = objects3d.NewPanel(630, 550, objects3d.PanelOrientation.horizont);
P_shelf_1_1.Name = "POLKA";
P_shelf_1_1.TextureOrientation = panelOperations.textureOrientation.horizontal;
moveMin(P_shelf_1_1, 16, 646, 0);
panelOperations.AddButt(P_shelf_1_1, 0, KR08);
panelOperations.AddButt(P_shelf_1_1, 2, BUM02);
P_shelf_1_1.Build();

let P_shelf_1_2 = objects3d.NewPanel(630, 550, objects3d.PanelOrientation.horizont);
P_shelf_1_2.Name = "POLKA";
P_shelf_1_2.TextureOrientation = panelOperations.textureOrientation.horizontal;
moveMin(P_shelf_1_2, 16, 1192, 0);
panelOperations.AddButt(P_shelf_1_2, 0, KR08);
panelOperations.AddButt(P_shelf_1_2, 2, BUM02);
P_shelf_1_2.Build();

let P_shelf_1_3 = objects3d.NewPanel(630, 550, objects3d.PanelOrientation.horizont);
P_shelf_1_3.Name = "POLKA";
P_shelf_1_3.TextureOrientation = panelOperations.textureOrientation.horizontal;
moveMin(P_shelf_1_3, 16, 1738, 0);
panelOperations.AddButt(P_shelf_1_3, 0, KR08);
panelOperations.AddButt(P_shelf_1_3, 2, BUM02);
P_shelf_1_3.Build();

let P_partition_1 = objects3d.NewPanel(600, 2168, objects3d.PanelOrientation.vertical);
P_partition_1.Name = "ST_SR";
P_partition_1.TextureOrientation = panelOperations.textureOrientation.vertical;
moveMin(P_partition_1, 646, 116, 0);
panelOperations.AddButt(P_partition_1, 1, KR08);
panelOperations.AddButt(P_partition_1, 3, BUM02);
P_partition_1.Build();

let P_shelf_2_1 = objects3d.NewPanel(630, 550, objects3d.PanelOrientation.horizont);
P_shelf_2_1.Name = "POLKA";
P_shelf_2_1.TextureOrientation = panelOperations.textureOrientation.horizontal;
moveMin(P_shelf_2_1, 662, 646, 0);
panelOperations.AddButt(P_shelf_2_1, 0, KR08);
panelOperations.AddButt(P_shelf_2_1, 2, BUM02);
P_shelf_2_1.Build();

let P_shelf_2_2 = objects3d.NewPanel(630, 550, objects3d.PanelOrientation.horizont);
P_shelf_2_2.Name = "POLKA";
P_shelf_2_2.TextureOrientation = panelOperations.textureOrientation.horizontal;
moveMin(P_shelf_2_2, 662, 1192, 0);
panelOperations.AddButt(P_shelf_2_2, 0, KR08);
panelOperations.AddButt(P_shelf_2_2, 2, BUM02);
P_shelf_2_2.Build();

let P_shelf_2_3 = objects3d.NewPanel(630, 550, objects3d.PanelOrientation.horizont);
P_shelf_2_3.Name = "POLKA";
P_shelf_2_3.TextureOrientation = panelOperations.textureOrientation.horizontal;
moveMin(P_shelf_2_3, 662, 1738, 0);
panelOperations.AddButt(P_shelf_2_3, 0, KR08);
panelOperations.AddButt(P_shelf_2_3, 2, BUM02);
P_shelf_2_3.Build();

let P_partition_2 = objects3d.NewPanel(600, 2168, objects3d.PanelOrientation.vertical);
P_partition_2.Name = "ST_SR";
P_partition_2.TextureOrientation = panelOperations.textureOrientation.vertical;
moveMin(P_partition_2, 1292, 116, 0);
panelOperations.AddButt(P_partition_2, 1, KR08);
panelOperations.AddButt(P_partition_2, 3, BUM02);
P_partition_2.Build();

let P_shelf_3_1 = objects3d.NewPanel(630, 550, objects3d.PanelOrientation.horizont);
P_shelf_3_1.Name = "POLKA";
P_shelf_3_1.TextureOrientation = panelOperations.textureOrientation.horizontal;
moveMin(P_shelf_3_1, 1308, 646, 0);
panelOperations.AddButt(P_shelf_3_1, 0, KR08);
panelOperations.AddButt(P_shelf_3_1, 2, BUM02);
P_shelf_3_1.Build();

let P_shelf_3_2 = objects3d.NewPanel(630, 550, objects3d.PanelOrientation.horizont);
P_shelf_3_2.Name = "POLKA";
P_shelf_3_2.TextureOrientation = panelOperations.textureOrientation.horizontal;
moveMin(P_shelf_3_2, 1308, 1192, 0);
panelOperations.AddButt(P_shelf_3_2, 0, KR08);
panelOperations.AddButt(P_shelf_3_2, 2, BUM02);
P_shelf_3_2.Build();

let P_shelf_3_3 = objects3d.NewPanel(630, 550, objects3d.PanelOrientation.horizont);
P_shelf_3_3.Name = "POLKA";
P_shelf_3_3.TextureOrientation = panelOperations.textureOrientation.horizontal;
moveMin(P_shelf_3_3, 1308, 1738, 0);
panelOperations.AddButt(P_shelf_3_3, 0, KR08);
panelOperations.AddButt(P_shelf_3_3, 2, BUM02);
P_shelf_3_3.Build();

let P_partition_3 = objects3d.NewPanel(600, 2168, objects3d.PanelOrientation.vertical);
P_partition_3.Name = "ST_SR";
P_partition_3.TextureOrientation = panelOperations.textureOrientation.vertical;
moveMin(P_partition_3, 1938, 116, 0);
panelOperations.AddButt(P_partition_3, 1, KR08);
panelOperations.AddButt(P_partition_3, 3, BUM02);
P_partition_3.Build();

let P_shelf_4_1 = objects3d.NewPanel(630, 550, objects3d.PanelOrientation.horizont);
P_shelf_4_1.Name = "POLKA";
P_shelf_4_1.TextureOrientation = panelOperations.textureOrientation.horizontal;
moveMin(P_shelf_4_1, 1954, 646, 0);
panelOperations.AddButt(P_shelf_4_1, 0, KR08);
panelOperations.AddButt(P_shelf_4_1, 2, BUM02);
P_shelf_4_1.Build();

let P_shelf_4_2 = objects3d.NewPanel(630, 550, objects3d.PanelOrientation.horizont);
P_shelf_4_2.Name = "POLKA";
P_shelf_4_2.TextureOrientation = panelOperations.textureOrientation.horizontal;
moveMin(P_shelf_4_2, 1954, 1192, 0);
panelOperations.AddButt(P_shelf_4_2, 0, KR08);
panelOperations.AddButt(P_shelf_4_2, 2, BUM02);
P_shelf_4_2.Build();

let P_shelf_4_3 = objects3d.NewPanel(630, 550, objects3d.PanelOrientation.horizont);
P_shelf_4_3.Name = "POLKA";
P_shelf_4_3.TextureOrientation = panelOperations.textureOrientation.horizontal;
moveMin(P_shelf_4_3, 1954, 1738, 0);
panelOperations.AddButt(P_shelf_4_3, 0, KR08);
panelOperations.AddButt(P_shelf_4_3, 2, BUM02);
P_shelf_4_3.Build();

let P_plinth = objects3d.NewPanel(2568, 100, objects3d.PanelOrientation.front);
P_plinth.Name = "COKOL";
moveMin(P_plinth, 16, 0, 564);
// Кромка фронтальної деталі не на всіх торцях — номери торців у BAZIS не перевірені.
P_plinth.Build();

// MountScheme (конфірмат + шкант) за парами деталей, що торкаються.
let Props = Action.Properties;
let Furn = Props.NewFurniture("Схема кріплення");
Furn.Click();
function M(a, b) {
  Furn.Value.MountScheme(a, b, 0, {x: 0, y: 0, z: 0});
}
M(P_top, P_side_left);
M(P_top, P_side_right);
M(P_bottom, P_side_left);
M(P_bottom, P_side_right);
M(P_shelf_1_1, P_side_left);
M(P_shelf_1_1, P_partition_1);
M(P_shelf_1_2, P_side_left);
M(P_shelf_1_2, P_partition_1);
M(P_shelf_1_3, P_side_left);
M(P_shelf_1_3, P_partition_1);
M(P_partition_1, P_top);
M(P_partition_1, P_bottom);
M(P_shelf_2_1, P_partition_1);
M(P_shelf_2_1, P_partition_2);
M(P_shelf_2_2, P_partition_1);
M(P_shelf_2_2, P_partition_2);
M(P_shelf_2_3, P_partition_1);
M(P_shelf_2_3, P_partition_2);
M(P_partition_2, P_top);
M(P_partition_2, P_bottom);
M(P_shelf_3_1, P_partition_2);
M(P_shelf_3_1, P_partition_3);
M(P_shelf_3_2, P_partition_2);
M(P_shelf_3_2, P_partition_3);
M(P_shelf_3_3, P_partition_2);
M(P_shelf_3_3, P_partition_3);
M(P_partition_3, P_top);
M(P_partition_3, P_bottom);
M(P_shelf_4_1, P_side_right);
M(P_shelf_4_1, P_partition_3);
M(P_shelf_4_2, P_side_right);
M(P_shelf_4_2, P_partition_3);
M(P_shelf_4_3, P_side_right);
M(P_shelf_4_3, P_partition_3);
M(P_plinth, P_side_left);
M(P_plinth, P_side_right);
M(P_plinth, P_bottom);

historyOperations.CommitCurrentChanges("ELVIN-TEST-2600x2300x600");
