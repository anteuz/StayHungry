import {CommonModule} from '@angular/common';
import {NgModule} from '@angular/core';
import {RouterModule} from '@angular/router';
import {IonicModule} from '@ionic/angular';
import {IsCollectedPipe} from './iscollected.pipe';
import {ObjectNamePipe} from './object-name.pipe';
import {StyledButtonComponent} from './styled-button.component';

@NgModule({
	imports: [
		CommonModule,
		RouterModule,
		IonicModule
	],
    declarations: [
        IsCollectedPipe,
        ObjectNamePipe,
        StyledButtonComponent
    ],
    exports: [
        CommonModule,
        IsCollectedPipe,
        ObjectNamePipe,
        StyledButtonComponent
    ]
})
export class SharedModule {}
