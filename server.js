/// Just Dance Cosmos
// v2 (Build 6)

// Lastest addition: Search function
// Next addition: Automatized playlist for New and Top 20

const express = require("express");
const fs = require("fs");
const path = require("path");
const https = require("https");
const app = express();
app.use(express.json());
app.use(express.static("public"));

var prodwsurl = "https://prod.just-dance.com";
var XMLHttpRequest = require("xmlhttprequest").XMLHttpRequest;
var room = "MainJD2019";

// Song database (for Nintendo Switch and PC)
const PCSongDB = require("./cosmos-database/v1/songdb/pc-cmos-songdb.json");
const PCSKUPackages = require("./cosmos-database/v1/packages/pc-cmos-skupkg.json");
const NXSongDB = require("./cosmos-database/v1/songdb/nx-cmos-songdb.json");
const NXSKUPackages = require("./cosmos-database/v1/packages/nx-cmos-skupkg.json");

// Extra database (stuff like LocaleIDs and Quests)
const LocaleID = require("./cosmos-database/v1/cosmos-localeid.json");
const QuestDB = require("./cosmos-database/v1/cosmos-questdb.json");
const ItemDB = require("./cosmos-database/v1/cosmos-itemdb.json");
const Avatars = require("./cosmos-database/v1/cosmos-avatardb.json");
const AliasDB = require("./cosmos-database/v1/cosmos-aliasdb.json");
const PlaylistDB = require("./cosmos-database/v1/cosmos-playlistdb.json");

// Quest carousel
const QJSONCarousel = require("./cosmos-database/v1/carousel/pages/all-cmos-questcar.json");

// Just Dance EX carousels
const EXJSONCarousel = require("./cosmos-database/v1/carousel/ex-cmos-partycar.json");

// V1, V2 and V3
const v1 = require("./cosmos-server/v1/configuration.json");
const v2 = require("./cosmos-server/v2/entities.json");
const v3 = require("./cosmos-server/v3/users/1b5f3c8c-4072-4d13-af9e-f47d7a6e8021.json");

// Others
const DM = require("./cosmos-functions/v1/blocks.json");
const SKUConstants = require("./cosmos-functions/v1/sku-constants.json");
const Ping = require("./cosmos-functions/v1/ping.json");
const COM = require("./cosmos-functions/v1/com-videos-fullscreen.json");
const UpsellVideos = require("./cosmos-functions/v1/pages/upsell-videos.json");
const CarouselPackages = require("./cosmos-functions/v1/pages/carousel/packages.json");
const Subs = require("./cosmos-functions/v1/subscription.json");
const JDTV = require("./cosmos-functions/v1/justdancetv.json");
const Home = require("./cosmos-functions/v1/home.json");
const SessionQuest = require("./cosmos-functions/v1/session-quest.json");

// Define "search" variable
var search;

// Customizable core
var carouselcore = {
  interactiveconfig: {
    playerseason: {
      isseasonactive: false,
      seasonname: "",
      seasonplaylist: [""],
    },
    playlists: {
      newsongs: ["MarioNX"],
      top20playlist: [],
    },
  },
};

// Carousel
/// Quest carousel
app.post("/carousel/v2/pages/quests", function (request, response) {
  response.send(QJSONCarousel);
});

/// New carousel code
app.get("/carousel/v2/pages/party", function (request, response) {
  const skuId = request.header("X-SkuId");
  switch (skuId) {
    case "jdex-pc-cmos":
      // Set the variables to SongDB and Carousel
      var OnlineDB = JSON.parse(
        JSON.stringify(
          require("./cosmos-database/v1/songdb/pc-cmos-songdb.json")
        )
      );
      var OnlineCarousel = JSON.parse(
        JSON.stringify(
          require("./cosmos-database/v1/carousel/ex-cmos-partycar.json")
        )
      );

      // Define the carousel as a function
      OnlineCarousel.categories.forEach(function (carousel) {
        // Add all the songs onto Just Dance Cosmos category
        if (carousel.title == "Just Dance Cosmos") {
          for (var songs in require("./cosmos-database/v1/songdb/pc-cmos-songdb.json")) {
            var song =
              require("./cosmos-database/v1/songdb/pc-cmos-songdb.json")[songs];
            var obj = JSON.parse(
              '{"__class":"Item","isc":"grp_cover","act":"ui_component_base","components":[{"__class":"JD_CarouselContentComponent_Song","mapName":"' +
                song.mapName +
                '"}],"actionList":"partyMap"}'
            );
            carousel.items.push(obj);
          }
        }

        // Playlist for New Songs
        if (
          carousel.title == "[icon:PLAYLIST] New songs in Just Dance Cosmos"
        ) {
          carouselcore.interactiveconfig.playlists.newsongs.forEach(function (
            song
          ) {
            var obj = JSON.parse(
              '{"__class":"Item","isc":"grp_cover","act":"ui_component_base","components":[{"__class":"JD_CarouselContentComponent_Song","mapName":"' +
                song +
                '"}],"actionList":"partyMap"}'
            );
            carousel.items.push(obj);
          });
        }

        // Add Just Dance songs onto it's own category
        if (carousel.title == "Just Dance") {
          for (var songs in require("./cosmos-database/v1/songdb/pc-cmos-songdb.json")) {
            var song =
              require("./cosmos-database/v1/songdb/pc-cmos-songdb.json")[songs];
            if (song.originalJDVersion == 1) {
              var obj = JSON.parse(
                '{"__class":"Item","isc":"grp_cover","act":"ui_component_base","components":[{"__class":"JD_CarouselContentComponent_Song","mapName":"' +
                  song.mapName +
                  '"}],"actionList":"partyMap"}'
              );
              carousel.items.push(obj);
            }
          }
        }

        // Add songs in their game categories (excl. ABBA, East and Kids)
        for (var songs in require("./cosmos-database/v1/songdb/pc-cmos-songdb.json")) {
          var song = require("./cosmos-database/v1/songdb/pc-cmos-songdb.json")[
            songs
          ];
          if (carousel.title == "Just Dance " + song.originalJDVersion) {
            var obj = JSON.parse(
              '{"__class":"Item","isc":"grp_cover","act":"ui_component_base","components":[{"__class":"JD_CarouselContentComponent_Song","mapName":"' +
                song.mapName +
                '"}],"actionList":"partyMap"}'
            );
            carousel.items.push(obj);
          }
        }

        // Add ABBA: You Can Dance songs onto it's own category
        if (carousel.title == "ABBA: You Can Dance") {
          for (var songs in require("./cosmos-database/v1/songdb/pc-cmos-songdb.json")) {
            var song =
              require("./cosmos-database/v1/songdb/pc-cmos-songdb.json")[songs];
            if (song.originalJDVersion == 4884) {
              var obj = JSON.parse(
                '{"__class":"Item","isc":"grp_cover","act":"ui_component_base","components":[{"__class":"JD_CarouselContentComponent_Song","mapName":"' +
                  song.mapName +
                  '"}],"actionList":"partyMap"}'
              );
              carousel.items.push(obj);
            }
          }
        }

        // Add Just Dance China and Japan songs onto it's own category
        if (carousel.title == "Just Dance East") {
          for (var songs in require("./cosmos-database/v1/songdb/pc-cmos-songdb.json")) {
            var song =
              require("./cosmos-database/v1/songdb/pc-cmos-songdb.json")[songs];
            if (song.originalJDVersion == 4514) {
              var obj = JSON.parse(
                '{"__class":"Item","isc":"grp_cover","act":"ui_component_base","components":[{"__class":"JD_CarouselContentComponent_Song","mapName":"' +
                  song.mapName +
                  '"}],"actionList":"partyMap"}'
              );
              carousel.items.push(obj);
            }
          }
        }

        // Add MUs and CMUs into their own category
        if (carousel.title == "Community Remixes & Mashups") {
          for (var songs in require("./cosmos-database/v1/songdb/pc-cmos-songdb.json")) {
            var song =
              require("./cosmos-database/v1/songdb/pc-cmos-songdb.json")[songs];
            if (song.mapName.includes("CMU") || song.mapName.includes("MU")) {
              var obj = JSON.parse(
                '{"__class":"Item","isc":"grp_cover","act":"ui_component_base","components":[{"__class":"JD_CarouselContentComponent_Song","mapName":"' +
                  song.mapName +
                  '"}],"actionList":"partyMap"}'
              );
              carousel.items.push(obj);
            }
          }
        }

        // Add Just Dance China / Japan songs onto it's own category
        if (carousel.title == "Just Dance Kids") {
          for (var songs in require("./cosmos-database/v1/songdb/pc-cmos-songdb.json")) {
            var song =
              require("./cosmos-database/v1/songdb/pc-cmos-songdb.json")[songs];
            if (song.originalJDVersion == 123) {
              var obj = JSON.parse(
                '{"__class":"Item","isc":"grp_cover","act":"ui_component_base","components":[{"__class":"JD_CarouselContentComponent_Song","mapName":"' +
                  song.mapName +
                  '"}],"actionList":"partyMap"}'
              );
              carousel.items.push(obj);
            }
          }
        }
      });

      if (
        request.body.searchString == "" ||
        request.body.searchString == undefined
      ) {
        response.send(OnlineCarousel);
      } else {
        search = JSON.parse(
          JSON.stringify(
            require("./cosmos-database/v1/carousel/ex-cmos-partycar.json")
          )
        );

        // add search result to search
        var current = 0;
        var splice = 0;
        search.categories.forEach(function (carousel) {
          if (carousel.title == "[icon:SEARCH_FILTER] Search") {
          } else {
            current = current + 1;
          }
        });
        var obj = JSON.parse(
          '{ "__class": "Category", "title": "[icon:SEARCH_RESULT] insert search result here", "items": [], "isc": "grp_row", "act": "ui_carousel" }'
        );
        search.categories.splice(current + 1, 0, obj);

        var CarouselDB = require("./cosmos-database/v1/songdb/pc-cmos-songdb.json");
        var query = request.body.searchString.toString().toUpperCase();

        var matches = [];
        for (var song in CarouselDB) {
          var obj = CarouselDB[song];

          var title = obj.title.toString().toUpperCase();
          var artist = obj.artist.toString().toUpperCase();
          var mapname = obj.mapName.toString().toUpperCase();
          var jdversion = obj.originalJDVersion.toString();
          var jdversion2 = "JUST DANCE " + obj.originalJDVersion.toString();
          var jdversion3 = "JD" + obj.originalJDVersion.toString();

          if (
            title.includes(query) == true ||
            jdversion.includes(query) == true ||
            jdversion2.includes(query) == true ||
            jdversion3.includes(query) == true ||
            artist.includes(query) == true ||
            mapname.includes(query) == true
          ) {
            matches.push(obj.mapName.toString());
          }
        }

        var carresponse = search;
        carresponse.categories.forEach(function (carousel) {
          // Add all the songs onto Just Dance Cosmos category
          if (carousel.title == "Just Dance Cosmos") {
            for (var songs in require("./cosmos-database/v1/songdb/pc-cmos-songdb.json")) {
              var song =
                require("./cosmos-database/v1/songdb/pc-cmos-songdb.json")[
                  songs
                ];
              var obj = JSON.parse(
                '{"__class":"Item","isc":"grp_cover","act":"ui_component_base","components":[{"__class":"JD_CarouselContentComponent_Song","mapName":"' +
                  song.mapName +
                  '"}],"actionList":"partyMap"}'
              );
              carousel.items.push(obj);
            }
          }

          // Playlist for New Songs
          if (
            carousel.title == "[icon:PLAYLIST] New songs in Just Dance Cosmos"
          ) {
            carouselcore.interactiveconfig.playlists.newsongs.forEach(function (
              song
            ) {
              var obj = JSON.parse(
                '{"__class":"Item","isc":"grp_cover","act":"ui_component_base","components":[{"__class":"JD_CarouselContentComponent_Song","mapName":"' +
                  song +
                  '"}],"actionList":"partyMap"}'
              );
              carousel.items.push(obj);
            });
          }

          // Add Just Dance songs onto it's own category
          if (carousel.title == "Just Dance") {
            for (var songs in require("./cosmos-database/v1/songdb/pc-cmos-songdb.json")) {
              var song =
                require("./cosmos-database/v1/songdb/pc-cmos-songdb.json")[
                  songs
                ];
              if (song.originalJDVersion == 1) {
                var obj = JSON.parse(
                  '{"__class":"Item","isc":"grp_cover","act":"ui_component_base","components":[{"__class":"JD_CarouselContentComponent_Song","mapName":"' +
                    song.mapName +
                    '"}],"actionList":"partyMap"}'
                );
                carousel.items.push(obj);
              }
            }
          }

          // Add songs in their game categories (excl. ABBA, East and Kids)
          for (var songs in require("./cosmos-database/v1/songdb/pc-cmos-songdb.json")) {
            var song =
              require("./cosmos-database/v1/songdb/pc-cmos-songdb.json")[songs];
            if (carousel.title == "Just Dance " + song.originalJDVersion) {
              var obj = JSON.parse(
                '{"__class":"Item","isc":"grp_cover","act":"ui_component_base","components":[{"__class":"JD_CarouselContentComponent_Song","mapName":"' +
                  song.mapName +
                  '"}],"actionList":"partyMap"}'
              );
              carousel.items.push(obj);
            }
          }

          // Add ABBA: You Can Dance songs onto it's own category
          if (carousel.title == "ABBA: You Can Dance") {
            for (var songs in require("./cosmos-database/v1/songdb/pc-cmos-songdb.json")) {
              var song =
                require("./cosmos-database/v1/songdb/pc-cmos-songdb.json")[
                  songs
                ];
              if (song.originalJDVersion == 4884) {
                var obj = JSON.parse(
                  '{"__class":"Item","isc":"grp_cover","act":"ui_component_base","components":[{"__class":"JD_CarouselContentComponent_Song","mapName":"' +
                    song.mapName +
                    '"}],"actionList":"partyMap"}'
                );
                carousel.items.push(obj);
              }
            }
          }

          // Add Just Dance China and Japan songs onto it's own category
          if (carousel.title == "Just Dance East") {
            for (var songs in require("./cosmos-database/v1/songdb/pc-cmos-songdb.json")) {
              var song =
                require("./cosmos-database/v1/songdb/pc-cmos-songdb.json")[
                  songs
                ];
              if (song.originalJDVersion == 4514) {
                var obj = JSON.parse(
                  '{"__class":"Item","isc":"grp_cover","act":"ui_component_base","components":[{"__class":"JD_CarouselContentComponent_Song","mapName":"' +
                    song.mapName +
                    '"}],"actionList":"partyMap"}'
                );
                carousel.items.push(obj);
              }
            }
          }

          // Add Just Dance China / Japan songs onto it's own category
          if (carousel.title == "Just Dance Kids") {
            for (var songs in require("./cosmos-database/v1/songdb/pc-cmos-songdb.json")) {
              var song =
                require("./cosmos-database/v1/songdb/pc-cmos-songdb.json")[
                  songs
                ];
              if (song.originalJDVersion == 123) {
                var obj = JSON.parse(
                  '{"__class":"Item","isc":"grp_cover","act":"ui_component_base","components":[{"__class":"JD_CarouselContentComponent_Song","mapName":"' +
                    song.mapName +
                    '"}],"actionList":"partyMap"}'
                );
                carousel.items.push(obj);
              }
            }
          }

          // Add MUs and CMUs into their own category
          if (carousel.title == "Community Remixes & Mashups") {
            for (var songs in require("./cosmos-database/v1/songdb/pc-cmos-songdb.json")) {
              var song =
                require("./cosmos-database/v1/songdb/pc-cmos-songdb.json")[
                  songs
                ];
              if (song.mapName.includes("CMU") || song.mapName.includes("MU")) {
                var obj = JSON.parse(
                  '{"__class":"Item","isc":"grp_cover","act":"ui_component_base","components":[{"__class":"JD_CarouselContentComponent_Song","mapName":"' +
                    song.mapName +
                    '"}],"actionList":"partyMap"}'
                );
                carousel.items.push(obj);
              }
            }
          }

          if (
            carousel.title == "[icon:SEARCH_RESULT] insert search result here"
          ) {
            carousel.title =
              "[icon:SEARCH_RESULT] " + request.body.searchString.toString();
            matches.forEach(function (arrayItem) {
              var obj = JSON.parse(
                '{"__class":"Item","isc":"grp_cover","act":"ui_component_base","components":[{"__class":"JD_CarouselContentComponent_Song","mapName":"' +
                  arrayItem +
                  '"}],"actionList":"partyMap"}'
              );
              carousel.items.push(obj);
            });
          }
        });

        response.send(carresponse);
      }
      break;
    case "jd2019-nx-all":
      response.send(EXJSONCarousel);
      break;
    default:
      response.send("Hey there!" + "\n" + "It's just a carousel, get serious");
      break;
  }
});

/// Just Dance / Dance Quest's Co-op carousel
app.post("/carousel/v2/pages/partycoop", function (request, response) {
  const skuId = request.header("X-SkuId");
  switch (skuId) {
    case "jdex-pc-cmos":
      response.send(EXJSONCarousel);
      break;
    case "jd2019-nx-all":
      response.send(EXJSONCarousel);
      break;
    default:
      response.send("Hey there!" + "\n" + "It's just a carousel, get serious");
      break;
  }
});

/// Sweat & Playlists carousel
app.post("/carousel/v2/pages/sweat", function (request, response) {
  const skuId = request.header("X-SkuId");
  switch (skuId) {
    case "jdex-pc-cmos":
      response.send(EXJSONCarousel);
      break;
    case "jd2019-nx-all":
      response.send(EXJSONCarousel);
      break;
    default:
      response.send("Hey there!" + "\n" + "It's just a carousel, get serious");
      break;
  }
});

// SongDB & skuPackages
app.get("/songdb/v2/songs", function (request, response) {
  const skuId = request.header("X-SkuId");
  switch (skuId) {
    case "jdex-pc-cmos":
      // Define a new variable for the SongDB, so it can change banners into map_bkgs
      var OnlineDB = require("./cosmos-database/v1/songdb/pc-cmos-songdb.json");
      for (var song in OnlineDB) {
        var obj = OnlineDB[song];
        if (
          obj.assets["map_bkgImageUrl"] == null ||
          obj.assets["map_bkgImageUrl"] == "" ||
          obj.assets["map_bkgImageUrl"] == undefined
        ) {
          obj.assets["banner_bkgImageUrl"] = obj.assets["banner_bkgImageUrl"];
        } else {
          obj.assets["banner_bkgImageUrl"] = obj.assets["map_bkgImageUrl"];
        }
      }
      return response.send(OnlineDB);
      break;
    case "jd2019-nx-all":
      response.send(NXSongDB);
      break;
    default:
      response.send(NXSongDB);
      break;
  }
});

// SKU Packages
app.get("/packages/v1/sku-packages", function (request, response) {
  const skuId = request.header("X-SkuId");
  switch (skuId) {
    case "jdex-pc-cmos":
      response.send(PCSKUPackages);
      break;
    case "jd2019-nx-all":
      response.send(NXSKUPackages);
      break;
    default:
      response.send(
        "Hey there!\nCosmos's SKU Packages (otherwise known as mainscenes) aren't currently unavaliable for public use"
      );
      break;
  }
});

// No HUDs (optimized)
app.get(
  "/content-authorization/:version/maps/:map",
  function (request, response) {
    const skuId = request.header("X-SkuId");
    switch (skuId) {
      case "jdex-pc-cmos":
        if (request.params.map) {
          var path = "./cosmos-database/v1/content-authorization/";
          if (fs.existsSync(path + request.params.map + ".json")) {
            fs.readFile(
              path + request.params.map + ".json",
              function (err, data) {
                if (err) {
                  throw err;
                }
                if (data) {
                  var strdata = JSON.parse(data),
                    pardata = JSON.stringify(strdata);
                  response.send(pardata);
                }
              }
            );
          } else {
            response.send("Forbidden");
          }
        }
        break;
      case "jd2019-nx-all":
        if (request.params.map) {
          var path = "./cosmos-database/v1/content-authorization/";
          if (fs.existsSync(path + request.params.map + ".json")) {
            fs.readFile(
              path + request.params.map + ".json",
              function (err, data) {
                if (err) {
                  throw err;
                }
                if (data) {
                  var strdata = JSON.parse(data),
                    pardata = JSON.stringify(strdata);
                  response.send(pardata);
                }
              }
            );
          } else {
            response.send("Forbidden");
          }
        }
        break;
      default:
        response.send(
          "Hey there!\nWe spent a real good time getting all of those No HUDs... So, is a no go"
        );
        break;
    }
  }
);

// Just Dance TV
app.post("/carousel/v2/pages/jdtv-nx", function (request, response) {
  response.send(JDTV);
});

// Home
app.post("/home/v1/tiles", function (request, response) {
  response.send(Home);
});

// Aliases
app.get("/aliasdb/v1/aliases", function (request, response) {
  response.send(AliasDB);
});

// Playlists
app.get("/playlistdb/v1/playlists", function (request, response) {
  response.send(PlaylistDB);
});

app.get("/carousel/v2/pages/jd2019-playlists", (request, response) => {
  response.send({
    __class: "JD_CarouselContent",
    categories: [
      {
        __class: "Category",
        title: "Recommended",
        act: "ui_carousel",
        isc: "grp_row",
        categoryType: "playlist",
        items: [
          {
            __class: "Item",
            isc: "grp_row",
            act: "ui_carousel",
            actionList: "_None",
            actionListUpsell: "_None",
            components: [
              {
                __class: "JD_CarouselContentComponent_Playlist",
                playlistID: "reco-top_country",
                displayCode: 1,
                displayMethod: "manual",
              },
            ],
          },
        ],
      },
      {
        __class: "Category",
        title: "Themed Playlists",
        act: "ui_carousel",
        isc: "grp_row",
        categoryType: "playlist",
        items: [],
      },
    ],
    actionLists: {
      _None: {
        __class: "ActionList",
        actions: [
          {
            __class: "Action",
            title: "None",
            type: "do-nothing",
          },
        ],
        itemType: "map",
      },
    },
    songItemLists: {},
  });
});

// Extra stuff
app.get("/questdb/v1/quests", function (request, response) {
  response.send(QuestDB);
});

app.get("/customizable-itemdb/v1/items", function (request, response) {
  response.send(ItemDB);
});

app.get("/songdb/v1/localisation", function (request, response) {
  const skuId = request.header("X-SkuId");
  switch (skuId) {
    case "jdex-pc-cmos":
      response.send(LocaleID);
      break;
    case "jd2019-nx-all":
      response.send(LocaleID);
      break;
    default:
      response.send(
        "Hey there!" +
          "\n" +
          "Really? Even the LocaleID file? Obviously you know that you can't get it"
      );
      break;
  }
});

app.get("/status/v1/ping", function (request, response) {
  response.send(Ping);
});

app.post("/com-video/v1/com-videos-fullscreen", function (request, response) {
  response.send(COM);
});

app.get("/constant-provider/v1/sku-constants", function (req, res) {
  res.send(SKUConstants);
});

app.post("/carousel/:version/packages", function (request, response) {
  response.send(CarouselPackages);
});

app.get("/session-quest/v1/", function (request, response) {
  response.send(SessionQuest);
});

app.post("/carousel/v2/pages/upsell-videos", function (request, response) {
  response.send(UpsellVideos);
});

app.post("/subscription/v1/refresh", function (request, response) {
  response.send(Subs);
});

// Community Remix (ded)
app.get("/community-remix/v1/active-contest", function (request, response) {
  var auth = request.header("Authorization");
  const httpsopts = {
    hostname: "prod.just-dance.com",
    port: 443,
    path: "/community-remix/v1/active-contest",
    method: "GET",
    headers: {
      "User-Agent": "UbiServices_SDK_HTTP_Client_4.2.9_PC32_ansi_static",
      Accept: "*/*",
      "Accept-Language": "en-us,en",
      Authorization: auth,
      "X-SkuId": "jd2019-nx-all",
    },
  };
  redirect(httpsopts, "", function (redResponse) {
    response.send(redResponse);
  });
});

// Leaderboards
app.get("/leaderboard/v1/maps/:map", (req, res) => {
  var auth = req.header("Authorization");
  const httpsopts = {
    hostname: "prod.just-dance.com",
    port: 443,
    path: "/leaderboard/v1/maps/" + req.params.map,
    method: "GET",
    headers: {
      "User-Agent": "UbiServices_SDK_HTTP_Client_4.2.9_PC32_ansi_static",
      Accept: "*/*",
      Authorization: auth,
      "Content-Type": "application/json",
      "X-SkuId": "jd2019-nx-all",
    },
  };
  redirect(httpsopts, "", function (redResponse) {
    var responsepar = JSON.parse(JSON.stringify(redResponse));
    res.send(responsepar);
    console.log(responsepar);
  });
});

// Dancer of the Week
app.get("/leaderboard/v1/maps/:map/dancer-of-the-week", (req, res) => {
  const checkFile = fs.existsSync("./cosmos-functions/v1/dancer-of-the-week/" + req.params.map + ".json");
  if (checkFile) {
    const readFile = fs.readFile("./cosmos-functions/v1/dancer-of-the-week/" + req.params.map + ".json");
    res.send(readFile);
  }
  else {
    var auth = req.header("Authorization");
      const httpsopts = {
        hostname: "prod.just-dance.com",
        port: 443,
        path: "/leaderboard/v1/maps/" + req.params.map + "/dancer-of-the-week",
        method: "GET",
        headers: {
          "User-Agent": "UbiServices_SDK_HTTP_Client_4.2.9_PC32_ansi_static",
          Accept: "*",
          Authorization: auth,
          "Content-Type": "application/json",
          "X-SkuId": "jd2019-nx-all",
        },
      };
      redirect(httpsopts, "", function (redResponse) {
        if (redResponse != "Not Found" || redResponse == {"__class": "DancerOfTheWeek"}){
          res.send(redResponse);
        }
        else {
          res.send({"__class": "DancerOfTheWeek"})
        }
      });
  }
});

app.post("/leaderboard/v1/maps/:map", (req, res) => {
  var auth = req.header("Authorization");
  var json = JSON.stringify(req.body);
  const httpsopts = {
    hostname: "prod.just-dance.com",
    port: 443,
    path: "/leaderboard/v1/maps/" + req.params.map,
    method: "POST",
    headers: {
      "User-Agent": "UbiServices_SDK_HTTP_Client_4.2.9_PC32_ansi_static",
      Accept: "*/*",
      "Accept-Language": "en-us,en",
      Authorization: auth,
      "X-SkuId": "jd2019-nx-all",
    },
  };
  redirect(httpsopts, json, function (redResponse) {
    res.send(redResponse);
  });
});

app.get("/leaderboard/v1/coop_points/mine", (req, res) => {
  var auth = req.header("Authorization");
  const httpsopts = {
    hostname: "prod.just-dance.com",
    port: 443,
    path: "/leaderboard/v1/coop_points/mine",
    method: "GET",
    headers: {
      "User-Agent": "UbiServices_SDK_HTTP_Client_4.2.9_PC32_ansi_static",
      Accept: "*/*",
      Authorization: auth,
      "Content-Type": "application/json",
      "X-SkuId": "jd2019-nx-all",
    },
  };
  redirect(httpsopts, "", function (redResponse) {
    res.send(redResponse);
  });
});

// World Dance Floor
app.post("/wdf/v1/assign-room", (req, res) => {
  res.send({
    room: room,
  });
});

app.post("/wdf/:version/rooms/" + room + "/*", (req, res) => {
  var ticket = req.header("Authorization");
  var xhr = new XMLHttpRequest();
  var result = req.url.substr(0);
  xhr.open("POST", prodwsurl + result, false);
  xhr.setRequestHeader("X-SkuId", "jd2019-nx-all");
  xhr.setRequestHeader("Authorization", ticket);
  xhr.setRequestHeader("Content-Type", "application/json");
  xhr.send(JSON.stringify(req.body, null, 2));
  res.send(xhr.responseText);
});

app.get("/wdf/:version/rooms/" + room + "/*", (req, res) => {
  var ticket = req.header("Authorization");
  var xhr = new XMLHttpRequest();
  var result = req.url.substr(0);
  xhr.open("GET", prodwsurl + result, false);
  xhr.setRequestHeader("X-SkuId", "jd2019-nx-all");
  xhr.setRequestHeader("Authorization", ticket);
  xhr.setRequestHeader("Content-Type", "application/json");
  xhr.send(JSON.stringify(req.body, null, 2));
  res.send(xhr.responseText);
});

app.get("/wdf/v1/online-bosses", (req, res) => {
  var auth = req.header("Authorization");
  const httpsopts = {
    hostname: "prod.just-dance.com",
    port: 443,
    path: "/wdf/v1/online-bosses",
    method: "GET",
    headers: {
      "User-Agent": "UbiServices_SDK_HTTP_Client_4.2.9_PC32_ansi_static",
      Accept: "*/*",
      "Accept-Language": "en-us,en",
      Authorization: auth,
      "X-SkuId": "jd2019-nx-all",
    },
  };
  redirect(httpsopts, "", function (redResponse) {
    res.send(redResponse);
  });
});

app.get("/wdf/v1/server-time", (req, res) => {
  var auth = req.header("Authorization");
  const httpsopts = {
    hostname: "prod.just-dance.com",
    port: 443,
    path: "/wdf/v1/server-time",
    method: "GET",
    headers: {
      "User-Agent": "UbiServices_SDK_HTTP_Client_4.2.9_PC32_ansi_static",
      Accept: "*/*",
      "Accept-Language": "en-us,en",
      Authorization: auth,
      "X-SkuId": "jd2019-nx-all",
    },
  };
  redirect(httpsopts, "", function (redResponse) {
    res.send(redResponse);
  });
});

// Profiles
app.get("/profile/v2/profiles", (req, res) => {
  var auth = req.header("Authorization");
  const httpsopts = {
    hostname: "prod.just-dance.com",
    port: 443,
    path: "/profile/v2/profiles?profileIds=" + req.query.profileIds,
    method: "GET",
    headers: {
      "User-Agent": "UbiServices_SDK_2017.Final.28_SWITCH64",
      Accept: "*/*",
      Authorization: auth,
      "Content-Type": "application/json",
      "X-SkuId": "jd2019-nx-all",
    },
  };
  redirect(httpsopts, "", function (redResponse) {
    res.send(redResponse);
  });
});

app.post("/profile/v2/profiles", function (req, res) {
  res.redirect(307, "https://prod.just-dance.com/profile/v2/profiles");
});

app.post("/profile/v2/map-ended", (req, res) => {
  var auth = req.header("Authorization");
  var codename = req.body;
  for (let i = 0; i < codename.length; i++) {
    var song = codename[i];
  }
  if (fs.existsSync("./cosmos-functions/v1/dancer-of-the-week/" + song.mapName + ".json")) {
    const readFile = fs.readFileSync(
      "./cosmos-functions/v1/dancer-of-the-week/" + song.mapName + ".json"
    );
    var JSONParFile = JSON.parse(readFile);
    if (JSONParFile.score > song.score) {
      res.send(`1`);
    }
  }
  else {
    var ticket = req.header("Authorization");
    var xhr33 = new XMLHttpRequest();
    xhr33.open(req.method, prodwsurl + req.url, true);
    xhr33.setRequestHeader("X-SkuId", "jd2019-nx-all");
    xhr33.setRequestHeader("Authorization", ticket);
    xhr33.setRequestHeader("Content-Type", "application/json");
    xhr33.send(JSON.stringify(req.body), null, 2);
    var getprofil1 = xhr33.responseText.toString();
    for (let i = 0; i < getprofil1.length; i++) {
      var profiljson = getprofil1[i];
    }
    
    console.log(profiljson)

    // Creates the local DOTW file
    var profiljson1 = JSON.parse(profiljson);
    console.log(profiljson1)
    var jsontodancerweek = {
      __class: "DancerOfTheWeek",
      score: song.score,
      profileId: profiljson1.profileId,
      gameVersion: "jd2019",
      rank: profiljson1.rank,
      name: profiljson1.name,
      avatar: profiljson1.avatar,
      country: profiljson1.country,
      platformId: profiljson1.platformId,
      //"platformId": "2535467426396224",
      alias: profiljson1.alias,
      aliasGender: profiljson1.aliasGender,
      jdPoints: profiljson1.jdPoints,
      portraitBorder: profiljson1.portraitBorder,
    };
    fs.writeFile("./cosmos-functions/v1/dancer-of-the-week/" + song.mapName + ".json", jsontodancerweek,function (err) {
        if (err) {
          console.log(err);
        } else {
          console.log("DOTW file for" + song.mapName + "created!");
        }
      }
    );

    res.send(profiljson);
  }
});

// Your dancer profile
app.post("/carousel/v2/pages/dancerprofile", (req, res) => {
  var auth = req.header("Authorization");
  const httpsopts = {
    hostname: "prod.just-dance.com",
    port: 443,
    path: "/carousel/v2/pages/dancerprofile",
    method: "POST",
    headers: {
      "User-Agent": "UbiServices_SDK_HTTP_Client_4.2.9_PC32_ansi_static",
      Accept: "*/*",
      "Accept-Language": "en-us,en",
      Authorization: auth,
      "Content-Type": "application/json",
      "X-SkuId": "jd2019-nx-all",
    },
  };
  redirect(httpsopts, req.body, function (redResponse) {
    res.send(redResponse);
  });
});

// Friends's dancer profiles
app.post("/carousel/v2/pages/friend-dancerprofile", (req, res) => {
  var json = JSON.stringify(req.body);
  var auth = req.header("Authorization");
  const httpsopts = {
    hostname: "prod.just-dance.com",
    port: 443,
    path: "/carousel/v2/pages/friend-dancerprofile?pid=" + req.query.pid,
    method: "POST",
    headers: {
      "User-Agent": "UbiServices_SDK_HTTP_Client_4.2.9_PC32_ansi_static",
      Accept: "*/*",
      "Accept-Language": "en-us,en",
      Authorization: auth,
      "Content-Type": "application/json",
      "X-SkuId": "jd2019-nx-all",
    },
  };
  redirect(httpsopts, json, function (redResponse) {
    res.send(redResponse);
  });
});

// Banned players (taken from Ubisoft's servers)
app.post("/profile/v2/filter-players", function (request, response) {
  response.send(
    '["00000000-0000-0000-0000-000000000000", "e3ec7209-242d-4c17-af1e-423de5288d6d", "73bae7d1-7713-48f8-a62d-7e8c73f0577a", "c9e6b976-46d9-4f2d-80b4-cc06a6fa7c9f", "14b2d506-a938-4451-b9f6-2c2115122a4e", "e970f896-5681-4bfe-9e07-c2a45c3ece67", "ee818be8-dcf3-42a6-9684-6f4fa2b641f1"]'
  );
});

// Country
var requestCountry = require("request-country");
app.get("/profile/v2/country", function (request, response) {
  var country = requestCountry(request);
  if (country == false) {
    country = "BR";
  }
  response.send('{ "country": "' + country + '" }');
});

// v1
app.get(
  "/:version/applications/:appid/configuration",
  function (request, response) {
    response.send(v1);
  }
);

// v2
app.get("/:version/spaces/:spaceid/entities", function (request, response) {
  response.send(v2);
});

// v3
app.get("/:version/users/:user", (req, res) => {
  var auth = req.header("Authorization");
  var sessionid = req.header("Ubi-SessionId");
  const httpsopts = {
    hostname: "public-ubiservices.ubi.com",
    port: 443,
    path: "/v3/users/" + req.params.user,
    method: "GET",
    headers: {
      "User-Agent": "UbiServices_SDK_HTTP_Client_4.2.9_PC32_ansi_static",
      Accept: "*/*",
      Authorization: auth,
      "Content-Type": "application/json",
      "ubi-appbuildid": "BUILDID_259645",
      "Ubi-AppId": req.header("Ubi-AppID"),
      "Ubi-localeCode": "en-us",
      "Ubi-Populations": "US_EMPTY_VALUE",
      "Ubi-SessionId": sessionid,
    },
  };
  redirect(httpsopts, "", function (redResponse) {
    res.send(redResponse);
  });
});

app.post("/:version/users/:user", (req, res) => {
  var auth = req.header("Authorization");
  var sessionid = req.header("Ubi-SessionId");
  const httpsopts = {
    hostname: "public-ubiservices.ubi.com",
    port: 443,
    path: "/v3/users/" + req.params.user,
    method: "GET",
    headers: {
      "User-Agent": "UbiServices_SDK_HTTP_Client_4.2.9_PC32_ansi_static",
      Accept: "*/*",
      Authorization: auth,
      "Content-Type": "application/json",
      "ubi-appbuildid": "BUILDID_259645",
      "Ubi-AppId": "341789d4-b41f-4f40-ac79-e2bc4c94ead4",
      "Ubi-localeCode": "en-us",
      "Ubi-Populations": "US_EMPTY_VALUE",
      "Ubi-SessionId": sessionid,
    },
  };
  redirect(httpsopts, "", function (redResponse) {
    res.send(redResponse);
  });
});

// listen for requests :)
const port = process.env.PORT || 80;
app.listen(port, function () {
  console.log("Your app is listening on port " + port);
});

// Función para redireccionar a otros sitios
// Es necesario un options que contiene los detalles de ruta, la manera (GET, POST) y la dirección
function redirect(options, write, callback) {
  var Redirect = https.request(options, (response) => {
    response.on("data", (data) => {
      callback(data);
    });
  });
  Redirect.on("error", (e) => {
    console.log(e);
  });
  Redirect.write(write);
  Redirect.end();
}
