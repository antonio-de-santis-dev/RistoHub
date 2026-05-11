import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MenuDTO, AccountDTO } from '../shared/model/risto.model';
import { AuthService } from '../core/auth/auth.service';

@Component({
  selector: 'app-menu-list',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './menu-list.component.html',
  styleUrls: ['./menu-list.component.scss'],
})
export class MenuListComponent implements OnInit {
  menus: MenuDTO[] = [];
  currentUser?: { login?: string };

  constructor(private authService: AuthService) {}

  ngOnInit(): void {
    this.loadMenus();
    this.currentUser = this.authService.getCurrentUser();
  }

  loadMenus(): void {
    // Esempio: Carica i menu dal backend (sostituisci con chiamata API reale)
    this.menus = [
      {
        id: 1,
        nome: 'Menu Estate 2026',
        descrizione: 'Menu estivo con piatti freschi',
        templateStyle: 'MODERNO',
        colorePrimario: '#C8102E',
        coloreSecondario: '#F5E6C8',
        fontMenu: 'Playfair Display',
        ristoratore: { login: 'admin' },
        portate: [],
        immagini: [],
      },
      {
        id: 2,
        nome: 'Menu Inverno 2026',
        descrizione: 'Menu invernale con piatti caldi',
        templateStyle: 'RUSTICO',
        colorePrimario: '#8B4513',
        coloreSecondario: '#F5F5DC',
        fontMenu: 'Georgia',
        ristoratore: { login: 'admin' },
        portate: [],
        immagini: [],
      },
    ];

    // Filtra i menu per l'utente corrente
    if (this.currentUser?.login) {
      this.menus = this.menus.filter(m => m.ristoratore?.login === this.currentUser?.login);
    }
  }

  templateLabel(style: string | undefined): string {
    switch (style) {
      case 'MODERNO':
        return 'Moderno';
      case 'RUSTICO':
        return 'Rustico';
      case 'CLASSICO':
        return 'Classico';
      default:
        return 'Sconosciuto';
    }
  }

  isModernoOrRustico(menu: MenuDTO): boolean {
    return menu.templateStyle === 'MODERNO' || menu.templateStyle === 'RUSTICO';
  }
}
