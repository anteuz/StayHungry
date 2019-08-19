import {CommonModule} from '@angular/common';
import {NgModule} from '@angular/core';
import {IsCollectedPipe} from './iscollected.pipe';
import {ObjectNamePipe} from './object-name.pipe';

@NgModule({
	imports:
		[CommonModule],
    declarations: [
        IsCollectedPipe,
        ObjectNamePipe
    ],
    exports: [
        CommonModule,
        IsCollectedPipe,
        ObjectNamePipe
    ]
})
export class SharedModule {}
