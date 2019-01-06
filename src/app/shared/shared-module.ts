import {CommonModule} from '@angular/common';
import {NgModule} from '@angular/core';
import {IsCollectedPipe} from './iscollected.pipe';

@NgModule({
    declarations: [
        IsCollectedPipe
    ],
    exports: [
        CommonModule,
        IsCollectedPipe
    ]
})
export class SharedModule {}
