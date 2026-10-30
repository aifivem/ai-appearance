import {
  BLIP_STYLE_FIELDS,
  PLACE_PED_SPEC,
  placePedFields,
  spec,
} from "@aicore-fivem/lib/shared";
import type { DataSpec, PanelSchema } from "@aicore-fivem/shared";

/** ai-appearance's panel: the creator room, prices, pay accounts, blips and the store locations. */

const blip: DataSpec = {
  type: "object",
  fields: BLIP_STYLE_FIELDS,
};
export const appearanceSchema: PanelSchema = {
  title: "ADMIN_APPEARANCE_TITLE",
  icon: "shirt",
  files: {
    settings: {
      kind: "settings",
      sync: "all",
      sections: {
        creator: { type: "vec4" },
        prices: {
          type: "object",
          fields: { clothing: spec.int(0, 1_000_000), barber: spec.int(0, 1_000_000) },
        },
        accounts: {
          type: "names",
          lookup: "account",
          max: 5,
          itemMax: 32,
          pattern: "^[a-z0-9_]{2,32}$",
        },
        blips: { type: "object", fields: { clothing: blip, barber: blip } },
      },
    },
    shops: {
      kind: "records",
      sync: "all",
      newRecord: {
        type: "clothing",
        coords: { x: 0, y: 0, z: 0 },
        radius: 6,
        blip: true,
      },
      sections: {
        ped: PLACE_PED_SPEC,
        type: { type: "enum", values: ["clothing", "barber"] },
        coords: { type: "vec3" },
        radius: { type: "number", min: 1, max: 30 },
        blip: { type: "bool" },
      },
    },
  },
  tabs: [
    {
      id: "shops",
      file: "shops",
      icon: "store",
      label: "ADMIN_TAB_SHOPS",
      desc: "ADMIN_TAB_SHOPS_DESC",
      listSub: "type",
      createLabel: "ADMIN_NEW_SHOP",
      deleteLabel: "ADMIN_DELETE_SHOP",
      cards: [
        {
          icon: "store",
          title: "ADMIN_C_SHOP",
          desc: "ADMIN_C_SHOP_DESC",
          fields: [
            {
              widget: "select",
              path: "type",
              label: "ADMIN_F_SHOP_TYPE",
              options: [
                { value: "clothing", label: "ADMIN_O_CLOTHING" },
                { value: "barber", label: "ADMIN_O_BARBER" },
              ],
            },
            {
              widget: "point",
              path: "coords",
              label: "ADMIN_F_SHOP_POINT",
              hint: "ADMIN_H_SHOP_POINT",
            },
            {
              widget: "number",
              path: "radius",
              label: "ADMIN_F_SHOP_RADIUS",
              hint: "ADMIN_H_SHOP_RADIUS",
              min: 1,
              max: 30,
              step: 0.5,
              unit: "ADMIN_U_METRES",
            },
            { widget: "switch", path: "blip", label: "ADMIN_F_SHOP_BLIP" },
          ],
        },
        {
          icon: "user",
          title: "ADMIN_C_PED",
          desc: "ADMIN_C_PED_DESC",
          fields: placePedFields(),
        },
      ],
    },
    {
      id: "settings",
      file: "settings",
      icon: "gear",
      label: "ADMIN_TAB_APPEARANCE",
      desc: "ADMIN_TAB_APPEARANCE_DESC",
      cards: [
        {
          icon: "palette",
          title: "ADMIN_C_CREATOR",
          desc: "ADMIN_C_CREATOR_DESC",
          fields: [
            {
              widget: "point",
              path: "creator",
              label: "ADMIN_F_CREATOR_POINT",
              hint: "ADMIN_H_CREATOR_POINT",
              heading: true,
              ground: true,
            },
          ],
        },
        {
          icon: "money-bill-wave",
          title: "ADMIN_C_PRICES",
          desc: "ADMIN_C_PRICES_DESC",
          fields: [
            {
              widget: "number",
              path: "prices.clothing",
              label: "ADMIN_F_PRICE_CLOTHING",
              hint: "ADMIN_H_PRICE_CLOTHING",
              min: 0,
              step: 10,
              unit: "$",
            },
            {
              widget: "number",
              path: "prices.barber",
              label: "ADMIN_F_PRICE_BARBER",
              hint: "ADMIN_H_PRICE_BARBER",
              min: 0,
              step: 10,
              unit: "$",
            },
            {
              widget: "tags",
              lookup: "account",
              path: "accounts",
              label: "ADMIN_F_PAY_ACCOUNTS",
              hint: "ADMIN_H_PAY_ACCOUNTS",
              placeholder: "ADMIN_PH_ACCOUNT_KEY",
            },
          ],
        },
        {
          icon: "shirt",
          title: "ADMIN_C_BLIP_CLOTHING",
          fields: [
            {
              widget: "blip",
              path: "blips.clothing",
              label: "ADMIN_F_BLIP_STYLE",
            },
          ],
        },
        {
          icon: "scissors",
          title: "ADMIN_C_BLIP_BARBER",
          fields: [
            {
              widget: "blip",
              path: "blips.barber",
              label: "ADMIN_F_BLIP_STYLE",
            },
          ],
        },
      ],
    },
  ],
};
