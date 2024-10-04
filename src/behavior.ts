import powerbi from "powerbi-visuals-api";
import { Selection as d3Selection } from "d3-selection";

import { WordCloudDataPoint } from "./dataInterfaces";

import ISelectionManager = powerbi.extensibility.ISelectionManager;
import ISelectionId = powerbi.visuals.ISelectionId;

type Selection<T1, T2 = T1> = d3Selection<any, T1, any, T2>;

export interface IWordCloudBehaviorOptions{
    wordsSelection: Selection<WordCloudDataPoint>;
    root: Selection<any>;
    main: Selection<any>;
}

export class WordCloudBehavior {
    private behaviorOptions: IWordCloudBehaviorOptions;
    private selectionManager: ISelectionManager;
    private static MaxOpacity: number = 1;
    private static MinOpacity: number = 0.2;

    private dataPoints: WordCloudDataPoint[];

    constructor(selectionManager: ISelectionManager) {
        this.selectionManager = selectionManager;
        this.selectionManager.registerOnSelectCallback(this.onSelectCallback.bind(this));
    }

    private onSelectCallback(selectionIds?: ISelectionId[]){
        this.applySelectionStateToData(selectionIds);
        this.renderSelection();
    }

    private applySelectionStateToData(selectionIds?: ISelectionId[]): void {
        const selectedIds: ISelectionId[] = <ISelectionId[]>this.selectionManager.getSelectionIds();
        this.setSelectedToDataPoints(this.dataPoints, selectionIds || selectedIds);
    }

    private setSelectedToDataPoints(dataPoints: WordCloudDataPoint[], ids: ISelectionId[]): void{
        dataPoints.forEach((dataPoint: WordCloudDataPoint) => {
            dataPoint.selected = false;
            ids.forEach((selectedId: ISelectionId) => {
                if (dataPoint.selectionIds.some(selectionId=> selectedId.equals(selectionId))) {
                    dataPoint.selected = true;
                }
            });
        });
    }

    public bindEvents(behaviorOptions: IWordCloudBehaviorOptions): void {
        this.behaviorOptions = behaviorOptions;
        this.dataPoints = behaviorOptions.wordsSelection.data();

        this.bindClickEvent(this.behaviorOptions.wordsSelection);
        this.bindClickEvent(this.behaviorOptions.root);

        this.bindContextMenuEvent(this.behaviorOptions.wordsSelection);
        this.bindContextMenuEvent(this.behaviorOptions.root);

        this.bindKeyboardEvent(this.behaviorOptions.wordsSelection);
        this.applySelectionStateToData();
    }

    private bindClickEvent(elements: Selection<any>): void {
        elements.on("click", (event: PointerEvent, dataPoint: WordCloudDataPoint | undefined) => {
            const isMultiSelection: boolean = event.ctrlKey || event.metaKey || event.shiftKey;
            if (dataPoint){
                // code to support deselection(without ctr key) of a word with array of selectionIds
                // since selectionManager.select(SelectionId[], false) always selects 
                const selectedIds: ISelectionId[] = this.selectionManager.getSelectionIds() as ISelectionId[];
                const selectionIds: ISelectionId[] = dataPoint.selectionIds
                    .filter(selectionId => !selectedIds.some(selectedId => selectedId.equals(selectionId)))
                    .concat(selectedIds.filter(selectedId => !dataPoint.selectionIds.some(selectionId => selectionId.equals(selectedId))));

                if (!selectionIds.length){
                    this.selectionManager.select(dataPoint.selectionIds, true);
                }
                else {
                    this.selectionManager.select(dataPoint.selectionIds, isMultiSelection);
                }
                event.stopPropagation();
            }
            else {
                this.selectionManager.clear();
            }
            this.onSelectCallback();
        });
    }

    private bindContextMenuEvent(elements: Selection<any>): void {
        elements.on("contextmenu", (event: PointerEvent, dataPoint: WordCloudDataPoint | undefined) => {
            this.selectionManager.showContextMenu(dataPoint ? dataPoint.selectionIds : {},
                {
                    x: event.clientX,
                    y: event.clientY
                }
            );
            event.preventDefault();
            event.stopPropagation();
        })
    }

    private bindKeyboardEvent(elements: Selection<any>): void {
        elements.on("keydown", (event : KeyboardEvent, dataPoint: WordCloudDataPoint) => {
            if (event.code !== "Enter" && event.code !== "Space") {
                return;
            }
            const isMultiSelection: boolean = event.ctrlKey || event.metaKey || event.shiftKey;
            // code to support deselection(without ctr key) of a word with array of selectionIds
            // since selectionManager.select(SelectionId[], false) does not deselect Ids
            // we want to remove this when the selection manager is fixed.
            const selectedIds: ISelectionId[] = <ISelectionId[]>this.selectionManager.getSelectionIds();
            const selectionIds: ISelectionId[] = dataPoint.selectionIds
                .filter(selectionId => !selectedIds.some(selectedId => selectedId.equals(selectionId)))
                .concat(selectedIds.filter(selectedId => !dataPoint.selectionIds.some(selectionId => selectionId.equals(selectedId))));

            if (!selectionIds.length){
                this.selectionManager.select(dataPoint.selectionIds, true);
            }
            else {
                this.selectionManager.select(dataPoint.selectionIds, isMultiSelection);
            }

            event.stopPropagation();
            this.onSelectCallback();
        });
    }

    public renderSelection(): void {
        const wordHasSelection: boolean = this.dataPoints.some((dataPoint: WordCloudDataPoint) => dataPoint.selected);

        if (!this.behaviorOptions.wordsSelection) {
            return;
        }

        this.behaviorOptions.wordsSelection.style("fill-opacity", (dataPoint: WordCloudDataPoint) => {
            return (dataPoint.selected && wordHasSelection) || !wordHasSelection
                ? WordCloudBehavior.MaxOpacity
                : WordCloudBehavior.MinOpacity;
        });

       this.behaviorOptions.wordsSelection.attr("aria-selected", (dataPoint: WordCloudDataPoint) => {
            return (dataPoint.selected && wordHasSelection) || !wordHasSelection
        });
    }
}