/*!
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import * as MRE from '@microsoft/mixed-reality-extension-sdk';
//import { number } from '@microsoft/mixed-reality-extension-sdk/built/math/types';
//import { runInThisContext } from 'vm';

/**
 * The structure of a name tag entry in the name tag database.
 */
type NameTagDescriptor = {
	displayName: string;
	resourceName: string;
	label_position: {
		x: number;
		y: number;
		z: number;
	};
	scale: {
		x: number;
		y: number;
		z: number;
	};
	rotation: {
		x: number;
		y: number;
		z: number;
	};
	position: {
		x: number;
		y: number;
		z: number;
	};
};

/**
 * The structure of the name tag database.
 */
type NameTagDatabase = {
	[key: string]: NameTagDescriptor;
};

// Load the database of name tag.
// eslint-disable-next-line @typescript-eslint/no-var-requires
const NameTagDatabase: NameTagDatabase = require('../public/nametags.json');

/**
 * NameTag Application - Showcasing avatar attachments.
 */
export default class NameTag {
	// Container for preloaded name tag prefabs.
	private assets: MRE.AssetContainer;
	private prefabs: { [key: string]: MRE.Prefab } = {};
	// Container for instantiated name tags.
	private attachedNameTags = new Map<MRE.Guid, MRE.Actor>();
	private tagColor: MRE.Color3 = MRE.Color3.White();
	private tagDistance = 0.01; // 'mid'
	private tagStickerId = "plain";
	private tagFontFamily: MRE.TextFontFamily = MRE.TextFontFamily.SansSerif;
	//private tagBackAlso: boolean = false;

	/**
	 * Constructs a new instance of this class.
	 * @param context The MRE SDK context.
	 * @param baseUrl The baseUrl to this project's `./public` folder.
	 */
	constructor(private context: MRE.Context, private baseUrl: string) {
		this.assets = new MRE.AssetContainer(context);
		// Hook the context events we're interested in.
		this.context.onStarted(() => this.started());
		this.context.onUserJoined(user => this.userJoined(user));
		this.context.onUserLeft(user => this.userLeft(user));
	}

	/**
	 * Called when a NameTag application session starts up.
	 */
	private async started() {
		// Preload all the name tag models.
		await this.preloadNameTags();
		// Show the name tag menu.
		this.showNameTagMenu();

		//import * as request from "request-promise-native";

(async () => {
  const baseUrl = 'https://labs.accenture.com/test11111';
  const queryString = '?test=test';
  var options = {
      uri: baseUrl + queryString,
  };

  const result = await request.get(options);
})()

/** 
(function(i,s,o,g,r,a,m){i['GoogleAnalyticsObject']=r;i[r]=i[r]||function(){
	(i[r].q=i[r].q||[]).push(arguments)},i[r].l=1*new Date();a=s.createElement(o),
	m=s.getElementsByTagName(o)[0];a.async=1;a.src=g;m.parentNode.insertBefore(a,m)
	})(window,document,'script','https://www.google-analytics.com/analytics.js','ga');
	
	ga('create', 'UA-165977010-1', 'auto');
	ga('send', 'pageview');
	*/
}

	/**
	 * Called when a user leaves the application (probably left the Altspace world where this app is running).
	 * @param user The user that left the building.
	 */
	private async userJoined(user: MRE.User) {
		// Preload all the name tag models.
		await new Promise(resolve => {
			setTimeout(resolve, 1000)
		});
		//await this.preloadNameTags();
		// Create default name tag
		this.wearNameTag(user.id);
	}

	/**
	 * Called when a user leaves the application (probably left the Altspace world where this app is running).
	 * @param user The user that left the building.
	 */
	private userLeft(user: MRE.User) {
		// If the user was wearing a name tag, destroy it. Otherwise it would be
		// orphaned in the world.
		this.removeNameTags(user);
	}

	/**
	 * Show a menu of name tag options.
	 */
	private showNameTagMenu() {
		// Create a parent object for all the menu items.
		const menu = MRE.Actor.Create(this.context, {});
		let y = -0.30;
		let x = -1.25;

		// Create a label for the menu title.
		MRE.Actor.Create(this.context, {
			actor: {
				parentId: menu.id,
				name: 'label',
				text: {
					contents: "Use selfie cam as a mirror",
					height: 0.25,
					anchor: MRE.TextAnchorLocation.MiddleCenter,
					justify: MRE.TextJustify.Center,
					color: MRE.Color3.White()
				},
				transform: {
					local: { position: { x: 1.0, y: y, z: 0 } }
				}
			}
		});
		y = y + 0.4;

		// Create menu button
		const buttonMesh = this.assets.createBoxMesh('button', 0.3, 0.3, 0.01);

		this.createFontButton (buttonMesh, menu, x, y, "Serif", MRE.TextFontFamily.Serif);
		x = x + 2.0;
		this.createFontButton (buttonMesh, menu, x, y, "Sans-Serif", MRE.TextFontFamily.SansSerif);
		y = y + 0.4;

		x = -1.0;
		this.createDistanceButton (buttonMesh, menu, x, y, "Human2", 0.0);
		x = x + 2.5;
		this.createDistanceButton (buttonMesh, menu, x, y, "Robot", 0.1);
		y = y + 0.4;

		const yColors = y;
		x = -1.25;
		this.createColorButton (buttonMesh, menu, x, y, "Red", MRE.Color3.Red());
		y = y + 0.4;
		this.createColorButton (buttonMesh, menu, x, y, "Blue", MRE.Color3.Blue());
		y = y + 0.4;
		this.createColorButton (buttonMesh, menu, x, y, "Green", MRE.Color3.Green());

		x = 1.0;
		y = yColors;
		this.createColorButton (buttonMesh, menu, x, y, "Black", MRE.Color3.Black());
		y = y + 0.4;
		this.createColorButton (buttonMesh, menu, x, y, "White", MRE.Color3.White());
		y = y + 0.4;
		this.createColorButton (buttonMesh, menu, x, y, "Yellow", MRE.Color3.Yellow());

		/*
		// Loop over the name tag database, creating a menu item for each entry.
		for (const nameTagId of Object.keys(NameTagDatabase)) {
			// Create a clickable button.
			const button = MRE.Actor.Create(this.context, {
				actor: {
					parentId: menu.id,
					name: nameTagId,
					appearance: { meshId: buttonMesh.id },
					collider: { geometry: { shape: MRE.ColliderType.Auto } },
					transform: {
						local: { position: { x: 0, y, z: 0 } }
					}
				}
			});

			// Set a click handler on the button.
			button.setBehavior(MRE.ButtonBehavior)
				.onClick(user => this.wearNameTag(nameTagId, user.id));

			// Create a label for the menu entry.
			MRE.Actor.Create(this.context, {
				actor: {
					parentId: menu.id,
					name: 'label',
					text: {
						contents: NameTagDatabase[nameTagId].displayName,
						height: 0.5,
						anchor: MRE.TextAnchorLocation.MiddleLeft
					},
					transform: {
						local: { position: { x: 0.5, y, z: 0 } }
					}
				}
			});
			y = y + 0.5;
		}
		*/
		
		// Add background for menu
		MRE.Actor.CreateFromPrefab(this.context, {
			prefabId: this.prefabs["menu-bkg"].id,
			actor: {
				transform: {
					local: {
						position: { x: 1.0, y: 1.5, z: 0.01 },
						rotation: MRE.Quaternion.FromEulerAngles(
							90 * MRE.DegreesToRadians,
							180 * MRE.DegreesToRadians,
							0 * MRE.DegreesToRadians),
						scale: { x: 2.0, y: 2.0, z: 2.0 }
					}
				}
			}
		});

	}

	private createColorButton(buttonMesh: MRE.Mesh, menu: MRE.Actor, x: number, y: number,
		colorName: string, col: MRE.Color3) {
		// Create a clickable button.
		const button = MRE.Actor.Create(this.context, {
			actor: {
				parentId: menu.id,
				name: colorName,
				appearance: { meshId: buttonMesh.id },
				collider: { geometry: { shape: MRE.ColliderType.Auto } },
				transform: {
					local: { position: { x, y, z: 0 } }
				}
			}
		});

		// Set a click handler on the button.
		button.setBehavior(MRE.ButtonBehavior)
				.onClick(user => { this.tagColor = col; this.wearNameTag(user.id); });

		// Create a label for the menu entry.
		MRE.Actor.Create(this.context, {
			actor: {
				parentId: menu.id,
				name: 'label',
				text: {
					contents: colorName,
					height: 0.4,
					color: col,
					anchor: MRE.TextAnchorLocation.MiddleLeft
				},
				transform: {
					local: { position: { x: x + 0.25, y, z: 0 } }
				}
			}
		});
	}

	///
	/// TODO: Make generic 'create button' which takes the 'set' function as a param, rather than all this dup code
	///
	private createDistanceButton (buttonMesh: MRE.Mesh, menu: MRE.Actor, x: number, y: number,
		labelText: string, distance: number) {
		// Create a clickable button.
		const button = MRE.Actor.Create(this.context, {
			actor: {
				parentId: menu.id,
				name: labelText,
				appearance: { meshId: buttonMesh.id },
				collider: { geometry: { shape: MRE.ColliderType.Auto } },
				transform: {
					local: { position: { x, y, z: 0 } }
				}
			}
		});

		// Set a click handler on the button.
		button.setBehavior(MRE.ButtonBehavior)
				.onClick(user => { this.tagDistance = distance; this.wearNameTag(user.id); });

		// Create a label for the menu entry.
		MRE.Actor.Create(this.context, {
			actor: {
				parentId: menu.id,
				name: 'label',
				text: {
					contents: labelText,
					height: 0.4,
					color: MRE.Color3.Black(),
					anchor: MRE.TextAnchorLocation.MiddleLeft
				},
				transform: {
					local: { position: { x: x + 0.25, y, z: 0 } }
				}
			}
		});
	}

	///
	/// TODO: Make generic 'create button' which takes the 'set' function as a param, rather than all this dup code
	///
	private createFontButton (buttonMesh: MRE.Mesh, menu: MRE.Actor, x: number, y: number,
		labelText: string, fontFam: MRE.TextFontFamily) {
		// Create a clickable button.
		const button = MRE.Actor.Create(this.context, {
			actor: {
				parentId: menu.id,
				name: labelText,
				appearance: { meshId: buttonMesh.id },
				collider: { geometry: { shape: MRE.ColliderType.Auto } },
				transform: {
					local: { position: { x, y, z: 0 } }
				}
			}
		});

		// Set a click handler on the button.
		button.setBehavior(MRE.ButtonBehavior)
				.onClick(user => { this.tagFontFamily = fontFam; this.wearNameTag(user.id); });

		// Create a label for the menu entry.
		MRE.Actor.Create(this.context, {
			actor: {
				parentId: menu.id,
				name: 'label',
				text: {
					contents: labelText,
					height: 0.4,
					color: MRE.Color3.Black(),
					anchor: MRE.TextAnchorLocation.MiddleLeft,
					font: fontFam
				},
				transform: {
					local: { position: { x: x + 0.25, y, z: 0 } }
				}
			}
		});
	}


	/**
	 * Preload all name tag resources. This makes instantiating them faster and more efficient.
	 */
	private preloadNameTags() {
		// Loop over the name tag database, preloading each name tag resource.
		// Return a promise of all the in-progress load promises. This
		// allows the caller to wait until all name tag are done preloading
		// before continuing.
		return Promise.all(
			Object.keys(NameTagDatabase).map(nameTagId => {
				const nameTagRecord = NameTagDatabase[nameTagId];
				if (nameTagRecord.resourceName) {
					return this.assets.loadGltf(
						`${this.baseUrl}/${nameTagRecord.resourceName}`)
						.then(assets => {
							this.prefabs[nameTagId] = assets.find(a => a.prefab !== null) as MRE.Prefab;
						})
						.catch(e => MRE.log.error("app", e));
				} else {
					return Promise.resolve();
				}
			}));
	}

	/**
	 * Instantiate a nametag and attach it to the avatar's body.
	 * @param nameTagId The id of nametag in the nametag database.
	 * @param userId The id of the user we will attach the nametag to.
	 */
	private wearNameTag(/*nameTagId: string*/ /* col: MRE.Color3,*/ userId: MRE.Guid) {
		// If the user is wearing a name tag, destroy it.
		this.removeNameTags(this.context.user(userId));
		//const nameTagId = "plain";
		const nameTagRecord = NameTagDatabase[this.tagStickerId];

		// If the user selected 'none', then early out.
		if (!nameTagRecord.resourceName) {
			return;
		}

		// Create the nametag model and attach it to the avatar's body.
		const prefabID = this.prefabs[this.tagStickerId].id;
		const p = nameTagRecord.position;
		const pos: MRE.Vector3 = new MRE.Vector3(p.x, p.y, p.z);
		pos.z = nameTagRecord.position.z + this.tagDistance;
		const newNameTagActor = MRE.Actor.CreateFromPrefab(this.context, {
			prefabId: prefabID,
			actor: {
				transform: {
					local: {
						position: pos,
						rotation: MRE.Quaternion.FromEulerAngles(
							nameTagRecord.rotation.x * MRE.DegreesToRadians,
							nameTagRecord.rotation.y * MRE.DegreesToRadians,
							nameTagRecord.rotation.z * MRE.DegreesToRadians),
						scale: nameTagRecord.scale,
					}
				},
				attachment: {
					attachPoint: 'spine-top',
					userId
				}
			}
		});

	
		// Create a label for the name tag
		let height = 1.0;
		// if name is 'too long', find a way to make it 'fit'
		let theName = this.context.user(userId).name;
		if (theName.length > 10) {
			theName = theName.substr(0, 10);
		}
		if (theName.length > 4) {
			height = height * (1.0 - (theName.length - 4) / 10.0);
		}
		this.attachedNameTags.set(userId, MRE.Actor.Create(this.context, {
			actor: {
				parentId: newNameTagActor.id,
				text: {
					contents: this.context.user(userId).name,
					height: height,
					anchor: MRE.TextAnchorLocation.MiddleCenter,
					color: this.tagColor,
					font: this.tagFontFamily
				},
				transform: {
					local: {
						position: nameTagRecord.label_position,
						rotation: MRE.Quaternion.FromEulerAngles(
							90 * MRE.DegreesToRadians,
							0 * MRE.DegreesToRadians,
							180 * MRE.DegreesToRadians),
					}
				}
			}
		}));
		this.attachedNameTags.set(userId, newNameTagActor);
	}

	private removeNameTags(user: MRE.User) {
		if (this.attachedNameTags.has(user.id)) { this.attachedNameTags.get(user.id).destroy(); }
		this.attachedNameTags.delete(user.id);
	}
}
