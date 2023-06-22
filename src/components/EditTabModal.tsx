import {
  ButtonItem,
  ConfirmModal, Dropdown,
  Field,
  Focusable,
  PanelSection,
  PanelSectionRow,
  SingleDropdownOption,
  TextField, ToggleField, gamepadDialogClasses
} from "decky-frontend-lib";
import { useState, VFC, Fragment, useEffect } from "react";
import { Filter, FilterElement, LibraryTabElement } from "./LibraryTab";
import { FaTrash } from "react-icons/fa";
import { cloneDeep } from "lodash";
import camelcase from "camelcase";
import { RegexFilter } from "./filters/RegexFilter";
import { CollectionFilter } from "./filters/CollectionFilter";
import { FriendsFilter } from "./filters/FriendsFilter";
import { TagsFilter } from "./filters/TagFilter";

const FilterTypes: string[] = [
  "collection",
  "installed",
  "regex"
];

type FilterOptionsProps = {
  index: number,
  filter: FilterElement<any>,
  filters: FilterElement<any>[],
  setFilters: React.Dispatch<React.SetStateAction<FilterElement<any>[]>>
}

const FilterOptions: VFC<FilterOptionsProps> = ({ index, filter, filters, setFilters }) => {
  const collectionDropdownOptions = collectionStore.userCollections.map((collection: { displayName: any; id: any; }) => { return { label: collection.displayName, data: collection.id } });

  function onCollectionChange(data: SingleDropdownOption) {
    const filter1 = cloneDeep(filter);
    filter1.params.collection = data.data;
    const filters1 = cloneDeep(filters);
    filters1[index] = filter1;
    setFilters(filters1);
  }

  function onInstalledChange(checked: boolean) {
    const filter1 = cloneDeep(filter);
    filter1.params.installed = checked ?? false;
    const filters1 = cloneDeep(filters);
    filters1[index] = filter1;
    setFilters(filters1);
  }

  function onRegexChange(e: React.ChangeEvent<HTMLInputElement>) {
    const filter1 = cloneDeep(filter);
    filter1.params.regex = e?.target.value;
    const filters1 = cloneDeep(filters);
    filters1[index] = filter1;
    setFilters(filters1);
  }

  function onFriendsChange(e: React.ChangeEvent<HTMLInputElement>) {
    
  }

  function onTagsChange(e: React.ChangeEvent<HTMLInputElement>) {
    
  }

  if (filter) {
    switch (filter.type) {
      case "regex":
        return (
          <Field
            label="Regex"
            description={ <TextField value={filter.params.regex} onChange={onRegexChange} /> }
          />
        );
      case "installed":
        return (
          <ToggleField label="Installed" checked={filter.params.installed} onChange={onInstalledChange} />
        );
      case "collection":
        return (
          <Field
            label="Collection"
            description={ <Dropdown rgOptions={collectionDropdownOptions} selectedOption={filter.params.collection} onChange={onCollectionChange} /> }
          />
        );
      case "friends":
        return (
          <Field
            label="Friends to Include"
            // TODO: make a multi select here
            description={ <TextField value={filter.params.friends} onChange={onFriendsChange} /> }
          />
        );
      case "tags":
        return (
          <Field
            label="Tags to include"
            // TODO: make a multi select here
            description={ <TextField value={filter.params.tags} onChange={onTagsChange} /> }
          />
        );
      default:
        return (
        <Fragment />
      );
    }
  } else {
    return (
      <Fragment />
    );
  }
}


type FilterEntryProps = {
  index: number,
  filter: FilterElement<any>,
  filters: FilterElement<any>[],
  setFilters: React.Dispatch<React.SetStateAction<FilterElement<any>[]>>
}

const FilterEntry: VFC<FilterEntryProps> = ({ index, filter, filters, setFilters }) => {
  const filterTypeOptions = FilterTypes.map(type => { return { label: type, data: type } });

  function onChange(data: SingleDropdownOption) {
    const filter1 = cloneDeep(filter);
    filter1.type = data.data;
    const filters1 = cloneDeep(filters);
    filters1[index] = filter1;
    setFilters(filters1);
  }

  function onDelete() {
    const filters1 = cloneDeep(filters);
    delete filters1[index];
    setFilters((filters1));
  }

  if (filter) {
    return (
      <div className="filter-entry">
        <Focusable style={{
          width: "100%",
          display: "flex",
          flexDirection: "row"
        }}>
          <Focusable style={{
            width: "calc(100% - 55px)"
          }}>
            <Dropdown rgOptions={filterTypeOptions} selectedOption={filter.type} onChange={onChange} />
          </Focusable>
          <Focusable style={{
              marginLeft: "10px",
              width: "45px"
            }}>
            <ButtonItem onClick={onDelete}>
              <FaTrash />
            </ButtonItem>
          </Focusable>
        </Focusable>
      </div>
    )
  } else {
    return (
      <Fragment/>
    );
  }
}

function isDefaultParams(filter: FilterElement<any>): boolean {
  switch (filter.type) {
    case "regex":
      return (filter as RegexFilter).params.regex != "";
    case "installed":
      return true;
    case "collection":
      return !!(filter as CollectionFilter).params.collection;
    case "friends":
      return (filter as FriendsFilter).params.friends.length > 0;
    case "tags":
      return (filter as TagsFilter).params.tags.length > 0;
  }
}

type EditModalProps = {
  closeModal: () => void,
  onConfirm?(shortcut: LibraryTabElement): any,
  title?: string,
  tab: LibraryTabElement,
}

export const EditTabModal: VFC<EditModalProps> = ({ closeModal, onConfirm = () => {}, tab, title = `Modifying: ${tab.title}`, }) => {
  const [id, setId] = useState<string>(tab.id);
  const [name, setName] = useState<string>(tab.title);
  const [filters, setFilters] = useState<FilterElement<any>[]>(tab.filters);

  const [canSave, setCanSave] = useState<boolean>(false);
  const [canAddFilter, setCanAddFilter] = useState<boolean>(true);

  useEffect(() => {
    setCanSave(id != "" && filters.length > 0);
  }, [id, filters]);

  useEffect(() => {
    setCanAddFilter(filters.every((filter) => !isDefaultParams(filter)) || filters.length == 0);
  }, [filters]);

  function onNameChange(e: React.ChangeEvent<HTMLInputElement>) {
    setName(e?.target.value);
    setId(camelcase(e?.target.value, { pascalCase: true }));
  }

  function onSave() {
    const updated: LibraryTabElement = {
      custom: tab.custom,
      id: id,
      title: name,
      filters: filters,
      position: tab.position
    };
    onConfirm(updated);
    closeModal();
  }

  function addFilter() {
    const filtersCopy = cloneDeep(filters);
    filtersCopy.push({
      type: "regex",
      params: {  regex: "" }
    });
    setFilters(filtersCopy);
  }

  return (
    <>
      <style>{`
        .tab-master-modal-scope .${gamepadDialogClasses.GamepadDialogContent} .DialogHeader {
          margin-left: 15px;
        }
        
        /* The button item */
        .tab-master-modal-scope .add-filter-btn {
          padding: 0 !important;
        }
        .tab-master-modal-scope .add-filter-btn .${gamepadDialogClasses.FieldLabel} {
          display: none;
        }
        .tab-master-modal-scope .add-filter-btn .${gamepadDialogClasses.FieldChildren} {
          width: 100%;
        }

        /* The button item wrapper */
        .tab-master-modal-scope .filter-entry .${gamepadDialogClasses.Field} {
          padding: 0;
          margin: 0;
        }
        /* The button item label */
        .tab-master-modal-scope .filter-entry .${gamepadDialogClasses.FieldLabel} {
          display: none;
        }
        /* The button item */
        .tab-master-modal-scope .filter-entry button.${gamepadDialogClasses.Button}.DialogButton {
          padding: 10px;
          min-width: 45px;
        }

        .tab-master-modal-scope .filter-params-input .${gamepadDialogClasses.Field}.${gamepadDialogClasses.WithBottomSeparatorStandard}::after {
          display: none
        }

        /* Filter section start */
        .tab-master-modal-scope .filter-start-cont {
          width: 100%;
          padding: 0;

          display: flex;
          flex-direction: row;

          justify-content: space-between;
          align-items: center;

          font-size: 14px;
        }
        .tab-master-modal-scope .filter-start-cont .filter-line {
          height: 2px;
          flex-grow: 1;
          
          background: #23262e;
        }
        .tab-master-modal-scope .filter-start-cont .filter-label {
          margin: 0px 5px;
          color: #343945;
        }
      `}</style>
      <div className="tab-master-modal-scope">
        <ConfirmModal
          bAllowFullSize
          onCancel={closeModal}
          onEscKeypress={closeModal}
          strTitle={title}
          onOK={onSave}
        >
          <PanelSection>
            <PanelSectionRow>
              <Field
                label="Name"
                description={ <TextField value={name} onChange={onNameChange} /> }
              />
            </PanelSectionRow>
          </PanelSection>
          <PanelSection title="Filters">
            <PanelSectionRow>
              {filters.map((filter, index) => {
                return (
                  <>
                    <div className="filter-start-cont">
                      <div className="filter-line" />
                      <div className="filter-label">Filter {index+1} - {filter.type[0].toUpperCase().concat(filter.type.substring(1))}</div>
                      <div className="filter-line" />
                    </div>
                    <Field
                      label="Filter Type"
                      description={ <FilterEntry index={index} filter={filter} filters={filters} setFilters={setFilters} /> }
                    />
                    <div className="filter-params-input">
                      <FilterOptions index={index} filter={filter} filters={filters} setFilters={setFilters} />
                    </div>
                    {index == filters.length - 1 ? (
                      <div className="filter-start-cont">
                        <div className="filter-line" />
                      </div>
                    ) : (
                      <Fragment/>
                    )}
                  </>
                );
              })}
            </PanelSectionRow>
            <PanelSectionRow>
              <div className="add-filter-btn">
                <ButtonItem onClick={addFilter}>
                  Add Filter
                </ButtonItem>
              </div>
            </PanelSectionRow>
          </PanelSection>
        </ConfirmModal>
      </div>
    </>
  );
}