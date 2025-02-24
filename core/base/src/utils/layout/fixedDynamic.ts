import {
  Layout,
  LayoutItem,
  NamedLayoutItem,
  NumLayoutItem,
  BytesLayoutItem,
  ObjectLayoutItem,
  ArrayLayoutItem,
  SwitchLayoutItem,
  LayoutToType,
  PrimitiveType,
  FixedConversion,
  isPrimitiveType,
} from "./layout";

type IsEmpty<T extends readonly unknown[]> =
  T extends readonly [unknown, ...unknown[]] ? false : true;

type IdLayoutPair = readonly [unknown, Layout];
type FilterItemsOfIdLayoutPairs<ILA extends readonly IdLayoutPair[], Fixed extends boolean> =
  ILA extends infer V extends readonly IdLayoutPair[]
  ? V extends readonly [infer H extends IdLayoutPair, ...infer T extends readonly IdLayoutPair[]]
    ? FilterItemsOfLayout<H[1], Fixed> extends infer L extends Layout
      ? IsEmpty<L> extends false
        ? [[H[0], L], ...FilterItemsOfIdLayoutPairs<T, Fixed>]
        : FilterItemsOfIdLayoutPairs<T, Fixed>
      : never
    : []
  : never;

type FilterItem<Item extends LayoutItem, Fixed extends boolean, D extends number = 4> =
  Item extends infer I extends LayoutItem
  ? I extends NumLayoutItem | BytesLayoutItem
    ? I extends { custom: PrimitiveType | FixedConversion<PrimitiveType, any> }
      ? Fixed extends true ? I : null
      : Fixed extends true ? null : I
    : I extends ArrayLayoutItem
    ? FilterItem<I["arrayItem"], Fixed, D> extends infer LI
      ? LI extends LayoutItem
        ? { readonly [K in keyof I]: K extends "arrayItem" ? LI : I[K] }
        : null
      : never
    : I extends ObjectLayoutItem
    ? FilterItemsOfLayout<I["layout"], Fixed> extends infer L extends Layout
      ? IsEmpty<L> extends false
        ? { readonly [K in keyof I]: K extends "layout" ? L : I[K] }
        : null
      : never
    : I extends SwitchLayoutItem
    ? { readonly [K in keyof I]:
        K extends "idLayoutPairs" ? FilterItemsOfIdLayoutPairs<I["idLayoutPairs"], Fixed> : I[K]
      }
    : never
  : never;

type FilterItemsOfLayout<L extends Layout, Fixed extends boolean> =
  L extends infer V extends Layout
  ? V extends readonly [infer H extends NamedLayoutItem, ...infer T extends Layout]
    ? FilterItem<H, Fixed> extends infer I
      ? I extends NamedLayoutItem
        ? [I, ...FilterItemsOfLayout<T, Fixed>]
        : FilterItemsOfLayout<T, Fixed>
      : never
    : []
  : never;

function filterItem(item: LayoutItem, fixed: boolean): LayoutItem | null {
  switch (item.binary) {
    case "int":
    case "uint":
    case "bytes": {
      const isFixedItem = item["custom"] !== undefined && (
        isPrimitiveType(item["custom"]) || isPrimitiveType(item["custom"].from)
      );
      return (fixed && isFixedItem || !fixed && !isFixedItem) ? item : null;
    }
    case "array": {
      const filtered = filterItem(item.arrayItem, fixed);
      return (filtered !== null) ? { ...item, arrayItem: filtered } : null;
    }
    case "object": {
      const filteredItems = internalFilterItemsOfLayout(item.layout, fixed);
      return (filteredItems.length > 0) ? { ...item, layout: filteredItems } : null;
    }
    case "switch": {
      const filteredIdLayoutPairs =
        (item.idLayoutPairs as IdLayoutPair[]).reduce(
          (acc: any, [idOrConversionId, idLayout]: any) => {
            const filteredItems = internalFilterItemsOfLayout(idLayout, fixed);
            return filteredItems.length > 0
              ? [...acc, [idOrConversionId, filteredItems]]
              : acc;
          },
          [] as any
        );
      return { ...item, idLayoutPairs: filteredIdLayoutPairs };
    }
  }
}

function internalFilterItemsOfLayout(layout: Layout, fixed: boolean): Layout {
  return layout.reduce(
    (acc: Layout, item: NamedLayoutItem) => {
      const filtered = filterItem(item, fixed) as NamedLayoutItem | null;
      return filtered !== null ? [...acc, filtered] : acc;
    },
    [] as Layout
  );
}

function filterItemsOfLayout<L extends Layout, const Fixed extends boolean>(
  layout: L,
  fixed: Fixed
): FilterItemsOfLayout<L, Fixed> {
  return internalFilterItemsOfLayout(layout, fixed) as FilterItemsOfLayout<L, Fixed>;
}

export type FixedItemsOfLayout<L extends Layout> = FilterItemsOfLayout<L, true>;
export type DynamicItemsOfLayout<L extends Layout> = FilterItemsOfLayout<L, false>;

export const fixedItemsOfLayout = <L extends Layout>(layout: L) =>
  filterItemsOfLayout(layout, true);

export const dynamicItemsOfLayout = <L extends Layout>(layout: L) =>
  filterItemsOfLayout(layout, false);

export function addFixedValues<L extends Layout>(
  layout: L,
  dynamicValues: LayoutToType<DynamicItemsOfLayout<L>>,
): LayoutToType<L> {
  const ret = {} as any;
  for (const item of layout) {
    const fromDynamic = () => dynamicValues[item.name as keyof typeof dynamicValues];
    switch (item.binary) {
      case "int":
      case "uint":
      case "bytes": {
        if (!(item as {omit?: boolean})?.omit)
          ret[item.name] = (item.custom !== undefined &&
              (isPrimitiveType(item.custom) || isPrimitiveType((item.custom as {from: any}).from))
            ) ? (isPrimitiveType(item.custom) ? item.custom : item.custom.to)
              : fromDynamic();
        break;
      }
      case "array": {
        if (item.name in dynamicValues) {
          ret[item.name] = (item.arrayItem.binary !== "object")
            ? fromDynamic()
            : (fromDynamic() as Layout).map(element =>
                addFixedValues((item.arrayItem as ObjectLayoutItem).layout, element)
              );
        }
        break;
      }
      case "object": {
        const subDynamicValues = (
          (item.name in dynamicValues) ? fromDynamic() : {}
        ) as LayoutToType<DynamicItemsOfLayout<typeof item.layout>>;
        ret[item.name] = addFixedValues(item.layout, subDynamicValues);
        break;
      }
      case "switch": {
        const id = (fromDynamic() as any)[item.idTag ?? "id"];
        const [_, idLayout] = (item.idLayoutPairs as IdLayoutPair[]).find(([idOrConversionId]) =>
          (Array.isArray(idOrConversionId) ? idOrConversionId[1] : idOrConversionId) == id
        )!;
        ret[item.name] = {
          [item.idTag ?? "id"]: id,
          ...addFixedValues(idLayout, fromDynamic() as any)
        };
        break;
      }
    }
  }
  return ret as LayoutToType<L>;
}
