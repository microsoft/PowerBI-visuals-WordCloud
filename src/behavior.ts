import powerbi from "powerbi-visuals-api";
import { Selection as d3Selection } from "d3-selection";
import { Transition as d3Transition } from 'd3-transition';
import isArray from "lodash.isarray";
import flatten from "lodash.flatten";

import { WordCloudDataPoint } from "./dataInterfaces";
import { pixelConverter as PixelConverter } from "powerbi-visuals-utils-typeutils";


import ISelectionManager = powerbi.extensibility.ISelectionManager;
import ISelectionId = powerbi.visuals.ISelectionId;

type Selection<T1, T2 = T1> = d3Selection<any, T1, any, T2>;
type Transition<T1, T2 = T1> = d3Transition<any, T1, any, T2>;


export interface IWordCloudBehaviorOptions{
    wordsSelection: Selection<WordCloudDataPoint>;
    root: Selection<any>;
    main: Selection<any>;
}

export class WordCloudBehavior {
    private behaviorOptions: IWordCloudBehaviorOptions;
    private selectionManager: ISelectionManager;
    private durationAnimations: number = 50;
    private static TheThirdLineHeight: string = PixelConverter.toString(14); // Note: This construction fixes bug #6343.
    private static TheFourthLineHeight: string = PixelConverter.toString(15); // Note: This construction fixes bug #6343.
    private static MaxOpacity: number = 1;
    private static MinOpacity: number = 0.2;

    private selectedWords: Set<string> = new Set<string>();
    private getSelectionIds: (value: string | string[]) => ISelectionId[];


    constructor(selectionManager: ISelectionManager, getSelectionIds: (value: string) => ISelectionId[], getDataPoints?: () => WordCloudDataPoint[]) {
        this.selectionManager = selectionManager;

        this.getSelectionIds = (value: string | string[]) => isArray(value)
            ? <ISelectionId[]>flatten((<string[]>value).map((valueElement: string) => {
                return getSelectionIds(valueElement);
            }))
            : getSelectionIds(value);

        this.selectionManager.registerOnSelectCallback((ids: ISelectionId[]) => {
            this.selectedWords.clear();
            ids.forEach((selection: ISelectionId) => {
                getDataPoints().forEach((dataPoint: WordCloudDataPoint) => {
                    if (dataPoint.selectionIds.find((id: ISelectionId) => id.equals(selection))){
                        this.selectedWords.add(dataPoint.text);
                    }
                });
            });
            this.renderSelection();
        });
    }

    public bindEvents(behaviorOptions: IWordCloudBehaviorOptions): void {
        this.behaviorOptions = behaviorOptions;

        this.bindClickEventToWords();
        this.bindClickEventToClearCatcher();
        this.renderSelection();
    }

    private bindClickEventToWords(): void {
        this.behaviorOptions.wordsSelection.on("click", (event: PointerEvent, word: WordCloudDataPoint) => {
            const isMultiSelection: boolean = event.ctrlKey || event.shiftKey || event.metaKey;
            const wordKey = word.text.toLocaleLowerCase();
            if (isMultiSelection){ 
                if (!this.selectedWords.has(wordKey)){
                    this.selectedWords.add(wordKey);
                    this.selectionManager.select(word.selectionIds, true);
                }
                else {
                    this.selectedWords.delete(wordKey);
                    const idsToSelect: ISelectionId[] = this.getSelectionIds(Array.from(this.selectedWords));
                    idsToSelect.length === 0 
                        ? this.selectionManager.clear()
                        : this.selectionManager.select(idsToSelect);
                }
            }
            else {
                if (this.selectedWords.has(wordKey) && this.selectedWords.size === 1){
                    this.selectedWords.clear();
                    this.selectionManager.clear();
                }
                else {
                    this.selectedWords.clear();
                    this.selectedWords.add(wordKey);
                    this.selectionManager.select(word.selectionIds);
                }
            }

            this.renderSelection();
            event.stopPropagation();
        });

        this.behaviorOptions.wordsSelection.on("contextmenu", (event: PointerEvent, word: WordCloudDataPoint) => {
            if (event) {
                this.selectionManager.showContextMenu(
                    word.selectionIds,
                    {
                        x: event.clientX,
                        y: event.clientY
                    });
                event.preventDefault();
                event.stopPropagation();
            }
        });
    }

    private bindClickEventToClearCatcher(): void {
        this.behaviorOptions.root.on("click", () => {
            this.selectedWords.clear();
            this.selectionManager.clear();
            this.renderSelection();
        });

        this.behaviorOptions.root.on("contextmenu", (event: PointerEvent) => {
            if (event) {
                this.selectionManager.showContextMenu(
                    null,
                    {
                        x: event.clientX,
                        y: event.clientY
                    });
                event.preventDefault();
            }
        });
    }

    private renderSelection(): void {
        if (!this.behaviorOptions.wordsSelection) {
            return;
        }

        if (!this.selectionManager.hasSelection()) {
            this.setOpacity(this.behaviorOptions.wordsSelection, WordCloudBehavior.MaxOpacity);

            return;
        }

        const selectedColumns: Selection<WordCloudDataPoint> = this.behaviorOptions.wordsSelection
            .filter((dataPoint: WordCloudDataPoint) => {
                const wordKey = dataPoint.text.toLocaleLowerCase();
                return this.selectedWords.has(wordKey);
            });

        this.setOpacity(this.behaviorOptions.wordsSelection, WordCloudBehavior.MinOpacity);
        this.setOpacity(selectedColumns, WordCloudBehavior.MaxOpacity);
    }

    private setOpacity(element: Selection<any>, opacityValue: number): void {
        element.style("fill-opacity", opacityValue);

        if (this.behaviorOptions.main) { // Note: This construction fixes bug #6343.
            this.behaviorOptions.main.style("line-height", WordCloudBehavior.TheThirdLineHeight);
            this.animateSelection(this.behaviorOptions.main, 0, this.durationAnimations)
                .style("line-height", WordCloudBehavior.TheFourthLineHeight);
        }
    }

    private animateSelection<T extends Selection<any>>(
        element: T,
        duration: number = 0,
        delay: number = 0,
        callback?: (data: any, index: number) => void): Transition<any> {

        return element.transition()
            .delay(delay)
            .duration(duration)
            .on("end", callback);
    }
}