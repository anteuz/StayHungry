import {CommonModule} from '@angular/common';
import {NgModule} from '@angular/core';
import {NavParams} from '@ionic/angular';
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
