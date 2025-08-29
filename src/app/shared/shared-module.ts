import {CommonModule} from '@angular/common';
import {NgModule} from '@angular/core';
import {RouterModule} from '@angular/router';
import {IonicModule} from '@ionic/angular';
import {IsCollectedPipe} from './iscollected.pipe';
import {ObjectNamePipe} from './object-name.pipe';
import {StyledButtonComponent} from './styled-button.component';
import {ThemeToggleComponent} from './theme-toggle.component';

@NgModule({
	imports: [
		CommonModule,
		RouterModule,
		IonicModule
	],
    declarations: [
        IsCollectedPipe,
        ObjectNamePipe,
        StyledButtonComponent,
        ThemeToggleComponent
    ],
    exports: [
        CommonModule,
        IsCollectedPipe,
        ObjectNamePipe,
        StyledButtonComponent,
        ThemeToggleComponent
    ]
})
export class SharedModule {}
