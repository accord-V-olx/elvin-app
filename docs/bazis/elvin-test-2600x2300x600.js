// ELVIN -> BAZIS 10
// Project: ELVIN-TEST-2600x2300x600
// Generated only from confirmed Wardrobe Engine geometry.

function moveMin(obj, x, y, z) {
  obj.Build();
  let g = obj.GabMin;
  obj.Translate(x - g.x, y - g.y, z - g.z);
  obj.Build();
}

materialData.SetupActiveMaterial("ДСП 16", 16);
let P_side_left = objects3d.NewPanel(600, 2300, objects3d.PanelOrientation.vertical);
P_side_left.Name = "ST_L";
P_side_left.TextureOrientation = panelOperations.textureOrientation.vertical;
moveMin(P_side_left, 0, 0, 0);

let P_side_right = objects3d.NewPanel(600, 2300, objects3d.PanelOrientation.vertical);
P_side_right.Name = "ST_R";
P_side_right.TextureOrientation = panelOperations.textureOrientation.vertical;
moveMin(P_side_right, 2584, 0, 0);

let P_top = objects3d.NewPanel(2568, 600, objects3d.PanelOrientation.horizont);
P_top.Name = "VERH";
P_top.TextureOrientation = panelOperations.textureOrientation.horizontal;
moveMin(P_top, 16, 2284, 0);

let P_bottom = objects3d.NewPanel(2568, 600, objects3d.PanelOrientation.horizont);
P_bottom.Name = "DNO";
P_bottom.TextureOrientation = panelOperations.textureOrientation.horizontal;
moveMin(P_bottom, 16, 100, 0);

let P_shelf_1_1 = objects3d.NewPanel(630, 550, objects3d.PanelOrientation.horizont);
P_shelf_1_1.Name = "POLKA_1_1";
P_shelf_1_1.TextureOrientation = panelOperations.textureOrientation.horizontal;
moveMin(P_shelf_1_1, 16, 646, 0);

let P_shelf_1_2 = objects3d.NewPanel(630, 550, objects3d.PanelOrientation.horizont);
P_shelf_1_2.Name = "POLKA_1_2";
P_shelf_1_2.TextureOrientation = panelOperations.textureOrientation.horizontal;
moveMin(P_shelf_1_2, 16, 1192, 0);

let P_shelf_1_3 = objects3d.NewPanel(630, 550, objects3d.PanelOrientation.horizont);
P_shelf_1_3.Name = "POLKA_1_3";
P_shelf_1_3.TextureOrientation = panelOperations.textureOrientation.horizontal;
moveMin(P_shelf_1_3, 16, 1738, 0);

let P_partition_1 = objects3d.NewPanel(600, 2168, objects3d.PanelOrientation.vertical);
P_partition_1.Name = "PEREG_1";
P_partition_1.TextureOrientation = panelOperations.textureOrientation.vertical;
moveMin(P_partition_1, 646, 116, 0);

let P_shelf_2_1 = objects3d.NewPanel(630, 550, objects3d.PanelOrientation.horizont);
P_shelf_2_1.Name = "POLKA_2_1";
P_shelf_2_1.TextureOrientation = panelOperations.textureOrientation.horizontal;
moveMin(P_shelf_2_1, 662, 646, 0);

let P_shelf_2_2 = objects3d.NewPanel(630, 550, objects3d.PanelOrientation.horizont);
P_shelf_2_2.Name = "POLKA_2_2";
P_shelf_2_2.TextureOrientation = panelOperations.textureOrientation.horizontal;
moveMin(P_shelf_2_2, 662, 1192, 0);

let P_shelf_2_3 = objects3d.NewPanel(630, 550, objects3d.PanelOrientation.horizont);
P_shelf_2_3.Name = "POLKA_2_3";
P_shelf_2_3.TextureOrientation = panelOperations.textureOrientation.horizontal;
moveMin(P_shelf_2_3, 662, 1738, 0);

let P_partition_2 = objects3d.NewPanel(600, 2168, objects3d.PanelOrientation.vertical);
P_partition_2.Name = "PEREG_2";
P_partition_2.TextureOrientation = panelOperations.textureOrientation.vertical;
moveMin(P_partition_2, 1292, 116, 0);

let P_shelf_3_1 = objects3d.NewPanel(630, 550, objects3d.PanelOrientation.horizont);
P_shelf_3_1.Name = "POLKA_3_1";
P_shelf_3_1.TextureOrientation = panelOperations.textureOrientation.horizontal;
moveMin(P_shelf_3_1, 1308, 646, 0);

let P_shelf_3_2 = objects3d.NewPanel(630, 550, objects3d.PanelOrientation.horizont);
P_shelf_3_2.Name = "POLKA_3_2";
P_shelf_3_2.TextureOrientation = panelOperations.textureOrientation.horizontal;
moveMin(P_shelf_3_2, 1308, 1192, 0);

let P_shelf_3_3 = objects3d.NewPanel(630, 550, objects3d.PanelOrientation.horizont);
P_shelf_3_3.Name = "POLKA_3_3";
P_shelf_3_3.TextureOrientation = panelOperations.textureOrientation.horizontal;
moveMin(P_shelf_3_3, 1308, 1738, 0);

let P_partition_3 = objects3d.NewPanel(600, 2168, objects3d.PanelOrientation.vertical);
P_partition_3.Name = "PEREG_3";
P_partition_3.TextureOrientation = panelOperations.textureOrientation.vertical;
moveMin(P_partition_3, 1938, 116, 0);

let P_shelf_4_1 = objects3d.NewPanel(630, 550, objects3d.PanelOrientation.horizont);
P_shelf_4_1.Name = "POLKA_4_1";
P_shelf_4_1.TextureOrientation = panelOperations.textureOrientation.horizontal;
moveMin(P_shelf_4_1, 1954, 646, 0);

let P_shelf_4_2 = objects3d.NewPanel(630, 550, objects3d.PanelOrientation.horizont);
P_shelf_4_2.Name = "POLKA_4_2";
P_shelf_4_2.TextureOrientation = panelOperations.textureOrientation.horizontal;
moveMin(P_shelf_4_2, 1954, 1192, 0);

let P_shelf_4_3 = objects3d.NewPanel(630, 550, objects3d.PanelOrientation.horizont);
P_shelf_4_3.Name = "POLKA_4_3";
P_shelf_4_3.TextureOrientation = panelOperations.textureOrientation.horizontal;
moveMin(P_shelf_4_3, 1954, 1738, 0);

// Edging and MountScheme are added only when their exact rule/contact data is confirmed.
historyOperations.CommitCurrentChanges("ELVIN-TEST-2600x2300x600");
