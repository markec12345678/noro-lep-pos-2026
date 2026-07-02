/**
 * Slovenian Restaurant Inventory Seed Data
 * ~200 artiklov tipičnih za slovenske restavracije
 *
 * Kategorije:
 * 1. Predjedi (appetizers)
 * 2. Juhe (soups)
 * 3. Solate (salads)
 * 4. Mesne jedi (meat dishes)
 * 5. Ribe in morski sadeži (fish & seafood)
 * 6. Vegetarijanske jedi (vegetarian)
 * 7. Pice (pizzas)
 * 8. Testenine (pasta)
 * 9. Priloge (side dishes)
 * 10. Sladice (desserts)
 * 11. Tople pijače (hot drinks)
 * 12. Brezalkoholne pijače (non-alcoholic)
 * 13. Pivo (beer)
 * 14. Vino (wine)
 * 15. Žgane pijače (spirits)
 * 16. Koktajli (cocktails)
 * 17. Embalaža (packaging)
 * 18. Pribor (utensils)
 * 19. Čistila (cleaning)
 */

export interface SeedItem {
  name: string
  category: string
  subcategory?: string
  unit: string // kos, kg, l, m, pak
  purchasePrice: number // nabavna cena
  salePrice?: number // prodajna cena (za meni artikle)
  minStock: number // minimalna zaloga za opozorilo
  supplier?: string
  description?: string
}

export const SEED_SUPPLIERS = [
  { name: 'Hofer Cash & Carry', email: 'info@hofer.si', phone: '+386 1 234 5678' },
  { name: 'Metro Cash & Carry', email: 'info@metro.si', phone: '+386 1 567 8901' },
  { name: 'Mercator POS', email: 'pos@mercator.si', phone: '+386 1 890 1234' },
  { name: 'Jata Emona', email: 'info@jata.si', phone: '+386 1 345 6789' },
  { name: 'Pivovarna Laško', email: 'info@pivovarna-lasko.si', phone: '+386 3 423 4100' },
  { name: 'Vinska klet Goriska Brda', email: 'info@brda.si', phone: '+386 5 304 5500' },
]

export const SEED_ITEMS: SeedItem[] = [
  // ============ PREDJEDI ============
  { name: 'Trški pršut', category: 'Predjedi', subcategory: 'Suho meso', unit: 'kg', purchasePrice: 25.0, salePrice: 8.5, minStock: 2, supplier: 'Jata Emona', description: 'Slovenski pršut, 12-mesečni' },
  { name: 'Pančeta', category: 'Predjedi', subcategory: 'Suho meso', unit: 'kg', purchasePrice: 12.0, salePrice: 5.0, minStock: 2, supplier: 'Jata Emona' },
  { name: 'Salama', category: 'Predjedi', subcategory: 'Suho meso', unit: 'kg', purchasePrice: 8.0, salePrice: 4.0, minStock: 2, supplier: 'Jata Emona' },
  { name: 'Mortadela', category: 'Predjedi', subcategory: 'Suho meso', unit: 'kg', purchasePrice: 9.0, salePrice: 4.5, minStock: 1, supplier: 'Jata Emona' },
  { name: 'Sir Mohant', category: 'Predjedi', subcategory: 'Siri', unit: 'kg', purchasePrice: 15.0, salePrice: 6.0, minStock: 1, supplier: 'Mercator POS', description: 'Slovenski sir z okusom' },
  { name: 'Sir Bovški', category: 'Predjedi', subcategory: 'Siri', unit: 'kg', purchasePrice: 18.0, salePrice: 7.0, minStock: 1, supplier: 'Mercator POS' },
  { name: 'Sir Tolminc', category: 'Predjedi', subcategory: 'Siri', unit: 'kg', purchasePrice: 16.0, salePrice: 6.5, minStock: 1, supplier: 'Mercator POS' },
  { name: 'Mozzarella', category: 'Predjedi', subcategory: 'Siri', unit: 'kg', purchasePrice: 7.0, salePrice: 4.0, minStock: 2, supplier: 'Hofer Cash & Carry' },
  { name: 'Parmezan', category: 'Predjedi', subcategory: 'Siri', unit: 'kg', purchasePrice: 22.0, salePrice: 8.0, minStock: 0.5, supplier: 'Metro Cash & Carry' },
  { name: 'Gorgonzola', category: 'Predjedi', subcategory: 'Siri', unit: 'kg', purchasePrice: 14.0, salePrice: 5.5, minStock: 0.5, supplier: 'Metro Cash & Carry' },
  { name: 'Oljke', category: 'Predjedi', subcategory: 'Razno', unit: 'kg', purchasePrice: 6.0, salePrice: 3.5, minStock: 1, supplier: 'Mercator POS' },
  { name: 'Trški jajca (10kos)', category: 'Predjedi', subcategory: 'Razno', unit: 'pak', purchasePrice: 2.5, salePrice: 0, minStock: 5, supplier: 'Mercator POS' },
  { name: 'Brusketa kruh', category: 'Predjedi', subcategory: 'Razno', unit: 'kos', purchasePrice: 0.5, salePrice: 2.5, minStock: 10, supplier: 'Mercator POS' },

  // ============ JUHE ============
  { name: 'Goveja juha', category: 'Juhé', subcategory: 'Klasične', unit: 'l', purchasePrice: 2.0, salePrice: 3.5, minStock: 5, supplier: 'Hofer Cash & Carry' },
  { name: 'Piščančja juha', category: 'Juhé', subcategory: 'Klasične', unit: 'l', purchasePrice: 1.8, salePrice: 3.0, minStock: 5, supplier: 'Hofer Cash & Carry' },
  { name: 'Paradižnikova juha', category: 'Juhé', subcategory: 'Kremne', unit: 'l', purchasePrice: 2.2, salePrice: 3.8, minStock: 5, supplier: 'Hofer Cash & Carry' },
  { name: 'Gobova juha', category: 'Juhé', subcategory: 'Kremne', unit: 'l', purchasePrice: 2.5, salePrice: 4.2, minStock: 5, supplier: 'Hofer Cash & Carry' },
  { name: 'Bučna juha', category: 'Juhé', subcategory: 'Kremne', unit: 'l', purchasePrice: 2.0, salePrice: 4.0, minStock: 3, supplier: 'Mercator POS', description: 'Sezonska' },
  { name: 'Janeževa juha', category: 'Juhé', subcategory: 'Klasične', unit: 'l', purchasePrice: 2.3, salePrice: 4.0, minStock: 3, supplier: 'Mercator POS' },
  { name: 'Riževa juha', category: 'Juhé', subcategory: 'Klasične', unit: 'l', purchasePrice: 1.9, salePrice: 3.5, minStock: 3, supplier: 'Hofer Cash & Carry' },

  // ============ SOLATE ============
  { name: 'Mešana solata', category: 'Solate', subcategory: 'Zelene', unit: 'kos', purchasePrice: 1.0, salePrice: 4.0, minStock: 10, supplier: 'Mercator POS' },
  { name: 'Solata Caesar', category: 'Solate', subcategory: 'Solate', unit: 'kos', purchasePrice: 2.5, salePrice: 6.5, minStock: 5, supplier: 'Mercator POS' },
  { name: 'Solata Caprese', category: 'Solate', subcategory: 'Solate', unit: 'kos', purchasePrice: 2.8, salePrice: 6.0, minStock: 5, supplier: 'Mercator POS' },
  { name: 'Šopska solata', category: 'Solate', subcategory: 'Solate', unit: 'kos', purchasePrice: 1.8, salePrice: 5.0, minStock: 5, supplier: 'Mercator POS' },
  { name: 'Solata z lososom', category: 'Solate', subcategory: 'Solate', unit: 'kos', purchasePrice: 4.0, salePrice: 9.0, minStock: 3, supplier: 'Metro Cash & Carry' },
  { name: 'Solata s tuno', category: 'Solate', subcategory: 'Solate', unit: 'kos', purchasePrice: 3.0, salePrice: 7.5, minStock: 3, supplier: 'Hofer Cash & Carry' },
  { name: 'Zelena solata', category: 'Solate', subcategory: 'Zelene', unit: 'kos', purchasePrice: 0.8, salePrice: 3.0, minStock: 10, supplier: 'Mercator POS' },
  { name: 'Paradižnik', category: 'Solate', subcategory: 'Sestavine', unit: 'kg', purchasePrice: 2.0, salePrice: 0, minStock: 5, supplier: 'Mercator POS' },
  { name: 'Kumare', category: 'Solate', subcategory: 'Sestavine', unit: 'kg', purchasePrice: 1.5, salePrice: 0, minStock: 3, supplier: 'Mercator POS' },
  { name: 'Paprika', category: 'Solate', subcategory: 'Sestavine', unit: 'kg', purchasePrice: 2.5, salePrice: 0, minStock: 3, supplier: 'Mercator POS' },
  { name: 'Čebula', category: 'Solate', subcategory: 'Sestavine', unit: 'kg', purchasePrice: 0.8, salePrice: 0, minStock: 5, supplier: 'Mercator POS' },

  // ============ MESNE JEDI ============
  { name: 'Čevapi (1kg)', category: 'Mesne jedi', subcategory: 'Mlete', unit: 'kg', purchasePrice: 7.0, salePrice: 14.5, minStock: 5, supplier: 'Jata Emona', description: 'Čevapi s kajmakom' },
  { name: 'Teleči zrezek', category: 'Mesne jedi', subcategory: 'Zrezki', unit: 'kg', purchasePrice: 18.0, salePrice: 19.5, minStock: 3, supplier: 'Jata Emona' },
  { name: 'Svinjski zrezek', category: 'Mesne jedi', subcategory: 'Zrezki', unit: 'kg', purchasePrice: 8.0, salePrice: 12.0, minStock: 5, supplier: 'Jata Emona' },
  { name: 'Piščančji zrezek', category: 'Mesne jedi', subcategory: 'Zrezki', unit: 'kg', purchasePrice: 6.0, salePrice: 11.0, minStock: 5, supplier: 'Jata Emona' },
  { name: 'Dunajski zrezek', category: 'Mesne jedi', subcategory: 'Zrezki', unit: 'kos', purchasePrice: 4.0, salePrice: 13.0, minStock: 10, supplier: 'Jata Emona' },
  { name: 'Pohani piščanec', category: 'Mesne jedi', subcategory: 'Pohani', unit: 'kos', purchasePrice: 3.0, salePrice: 10.5, minStock: 10, supplier: 'Jata Emona' },
  { name: 'Pohani sir', category: 'Mesne jedi', subcategory: 'Pohani', unit: 'kos', purchasePrice: 2.0, salePrice: 8.5, minStock: 10, supplier: 'Mercator POS' },
  { name: 'Pohana teletina', category: 'Mesne jedi', subcategory: 'Pohani', unit: 'kos', purchasePrice: 4.5, salePrice: 14.0, minStock: 5, supplier: 'Jata Emona' },
  { name: 'Teleči ražnjiči', category: 'Mesne jedi', subcategory: 'Ražnjiči', unit: 'kos', purchasePrice: 4.5, salePrice: 18.0, minStock: 10, supplier: 'Jata Emona' },
  { name: 'Piščančji ražnjiči', category: 'Mesne jedi', subcategory: 'Ražnjiči', unit: 'kos', purchasePrice: 3.0, salePrice: 14.0, minStock: 10, supplier: 'Jata Emona' },
  { name: 'Cevapi s kajmakom', category: 'Mesne jedi', subcategory: 'Mlete', unit: 'kos', purchasePrice: 4.0, salePrice: 14.5, minStock: 10, supplier: 'Jata Emona' },
  { name: 'Pljeskavica', category: 'Mesne jedi', subcategory: 'Mlte', unit: 'kos', purchasePrice: 3.0, salePrice: 12.0, minStock: 10, supplier: 'Jata Emona' },
  { name: 'Burger 180g', category: 'Mesne jedi', subcategory: 'Burgerji', unit: 'kos', purchasePrice: 3.5, salePrice: 15.0, minStock: 10, supplier: 'Jata Emona' },
  { name: 'Burger 150g', category: 'Mesne jedi', subcategory: 'Burgerji', unit: 'kos', purchasePrice: 3.0, salePrice: 12.0, minStock: 10, supplier: 'Jata Emona' },
  { name: 'Klobasa', category: 'Mesne jedi', subcategory: 'Klobase', unit: 'kg', purchasePrice: 8.0, salePrice: 12.0, minStock: 3, supplier: 'Jata Emona' },
  { name: 'Kranjska klobasa', category: 'Mesne jedi', subcategory: 'Klobase', unit: 'kos', purchasePrice: 2.5, salePrice: 8.0, minStock: 10, supplier: 'Jata Emona' },
  { name: 'Debela klobasa', category: 'Mesne jedi', subcategory: 'Klobase', unit: 'kos', purchasePrice: 2.0, salePrice: 7.0, minStock: 10, supplier: 'Jata Emona' },
  { name: 'Šampinjoni na žaru', category: 'Mesne jedi', subcategory: 'Žar', unit: 'kg', purchasePrice: 4.0, salePrice: 10.0, minStock: 2, supplier: 'Mercator POS' },
  { name: 'Telečja jetra', category: 'Mesne jedi', subcategory: 'Drobovina', unit: 'kg', purchasePrice: 8.0, salePrice: 14.0, minStock: 1, supplier: 'Jata Emona' },

  // ============ RIBE IN MORSKI SADEŽI ============
  { name: 'Brancin', category: 'Ribe', subcategory: 'Morske', unit: 'kg', purchasePrice: 22.0, salePrice: 28.0, minStock: 2, supplier: 'Metro Cash & Carry' },
  { name: 'Orada', category: 'Ribe', subcategory: 'Morske', unit: 'kg', purchasePrice: 20.0, salePrice: 26.0, minStock: 2, supplier: 'Metro Cash & Carry' },
  { name: 'Tuna steak', category: 'Ribe', subcategory: 'Morske', unit: 'kg', purchasePrice: 28.0, salePrice: 35.0, minStock: 1, supplier: 'Metro Cash & Carry' },
  { name: 'Losos', category: 'Ribe', subcategory: 'Morske', unit: 'kg', purchasePrice: 18.0, salePrice: 24.0, minStock: 2, supplier: 'Metro Cash & Carry' },
  { name: 'Sardine', category: 'Ribe', subcategory: 'Morske', unit: 'kg', purchasePrice: 8.0, salePrice: 14.0, minStock: 2, supplier: 'Metro Cash & Carry' },
  { name: 'Lignji', category: 'Ribe', subcategory: 'Morski sadeži', unit: 'kg', purchasePrice: 14.0, salePrice: 20.0, minStock: 2, supplier: 'Metro Cash & Carry' },
  { name: 'Kozice', category: 'Ribe', subcategory: 'Morski sadeži', unit: 'kg', purchasePrice: 16.0, salePrice: 24.0, minStock: 1, supplier: 'Metro Cash & Carry' },
  { name: 'Školjke', category: 'Ribe', subcategory: 'Morski sadeži', unit: 'kg', purchasePrice: 10.0, salePrice: 16.0, minStock: 1, supplier: 'Metro Cash & Carry' },
  { name: 'Dagnje', category: 'Ribe', subcategory: 'Morski sadeži', unit: 'kg', purchasePrice: 8.0, salePrice: 14.0, minStock: 1, supplier: 'Metro Cash & Carry' },
  { name: 'Postrv', category: 'Ribe', subcategory: 'Sladkovodne', unit: 'kg', purchasePrice: 12.0, salePrice: 18.0, minStock: 2, supplier: 'Mercator POS' },
  { name: 'Šaran', category: 'Ribe', subcategory: 'Sladkovodne', unit: 'kg', purchasePrice: 6.0, salePrice: 12.0, minStock: 1, supplier: 'Mercator POS' },

  // ============ VEGETARIJANSKE JEDI ============
  { name: 'Štruklji', category: 'Vegetarijanske', subcategory: 'Tradicionalne', unit: 'kos', purchasePrice: 2.0, salePrice: 6.0, minStock: 10, supplier: 'Mercator POS' },
  { name: 'Žlikrofi', category: 'Vegetarijanske', subcategory: 'Tradicionalne', unit: 'kos', purchasePrice: 2.5, salePrice: 7.0, minStock: 10, supplier: 'Mercator POS' },
  { name: 'Ričet', category: 'Vegetarijanske', subcategory: 'Tradicionalne', unit: 'l', purchasePrice: 2.0, salePrice: 4.5, minStock: 5, supplier: 'Hofer Cash & Carry' },
  { name: 'Jota', category: 'Vegetarijanske', subcategory: 'Tradicionalne', unit: 'l', purchasePrice: 2.2, salePrice: 5.0, minStock: 5, supplier: 'Hofer Cash & Carry' },
  { name: 'Ajdovi žganci', category: 'Vegetarijanske', subcategory: 'Tradicionalne', unit: 'kg', purchasePrice: 1.5, salePrice: 5.0, minStock: 2, supplier: 'Mercator POS' },
  { name: 'Polenta', category: 'Vegetarijanske', subcategory: 'Priloge', unit: 'kg', purchasePrice: 1.2, salePrice: 4.0, minStock: 2, supplier: 'Mercator POS' },

  // ============ PICE ============
  { name: 'Pizza Margherita', category: 'Pice', subcategory: 'Klasične', unit: 'kos', purchasePrice: 2.5, salePrice: 11.0, minStock: 10, supplier: 'Metro Cash & Carry' },
  { name: 'Pizza Capricciosa', category: 'Pice', subcategory: 'Klasične', unit: 'kos', purchasePrice: 3.5, salePrice: 13.0, minStock: 10, supplier: 'Metro Cash & Carry' },
  { name: 'Pizza Quattro Formaggi', category: 'Pice', subcategory: 'Klasične', unit: 'kos', purchasePrice: 3.8, salePrice: 14.0, minStock: 10, supplier: 'Metro Cash & Carry' },
  { name: 'Pizza Prosciutto', category: 'Pice', subcategory: 'Klasične', unit: 'kos', purchasePrice: 3.5, salePrice: 13.5, minStock: 10, supplier: 'Metro Cash & Carry' },
  { name: 'Pizza Diavola', category: 'Pice', subcategory: 'Pikantne', unit: 'kos', purchasePrice: 3.5, salePrice: 13.0, minStock: 10, supplier: 'Metro Cash & Carry' },
  { name: 'Pizza Funghi', category: 'Pice', subcategory: 'Klasične', unit: 'kos', purchasePrice: 3.0, salePrice: 12.0, minStock: 10, supplier: 'Metro Cash & Carry' },
  { name: 'Pizza Tonno', category: 'Pice', subcategory: 'Ribe', unit: 'kos', purchasePrice: 3.5, salePrice: 13.0, minStock: 10, supplier: 'Metro Cash & Carry' },
  { name: 'Pizza Vegetariana', category: 'Pice', subcategory: 'Vegetarijanske', unit: 'kos', purchasePrice: 3.0, salePrice: 12.5, minStock: 10, supplier: 'Metro Cash & Carry' },
  { name: 'Pizza Pepperoni', category: 'Pice', subcategory: 'Pikantne', unit: 'kos', purchasePrice: 3.2, salePrice: 12.5, minStock: 10, supplier: 'Metro Cash & Carry' },
  { name: 'Pizza Hawaii', category: 'Pice', subcategory: 'Sladko-kislo', unit: 'kos', purchasePrice: 3.2, salePrice: 12.5, minStock: 10, supplier: 'Metro Cash & Carry' },
  { name: 'Pizza testo (predpripravljeno)', category: 'Pice', subcategory: 'Sestavine', unit: 'kos', purchasePrice: 0.8, salePrice: 0, minStock: 20, supplier: 'Metro Cash & Carry' },
  { name: 'Pelati (paradižnikova osnova)', category: 'Pice', subcategory: 'Sestavine', unit: 'l', purchasePrice: 2.0, salePrice: 0, minStock: 5, supplier: 'Hofer Cash & Carry' },
  { name: 'Mozzarella za pico', category: 'Pice', subcategory: 'Sestavine', unit: 'kg', purchasePrice: 5.0, salePrice: 0, minStock: 3, supplier: 'Hofer Cash & Carry' },

  // ============ TESTENINE ============
  { name: 'Špageti (500g)', category: 'Testenine', subcategory: 'Dolge', unit: 'pak', purchasePrice: 1.2, salePrice: 0, minStock: 10, supplier: 'Hofer Cash & Carry' },
  { name: 'Fusilli (500g)', category: 'Testenine', subcategory: 'Kratke', unit: 'pak', purchasePrice: 1.2, salePrice: 0, minStock: 10, supplier: 'Hofer Cash & Carry' },
  { name: 'Penne (500g)', category: 'Testenine', subcategory: 'Kratke', unit: 'pak', purchasePrice: 1.2, salePrice: 0, minStock: 10, supplier: 'Hofer Cash & Carry' },
  { name: 'Tagliatelle (500g)', category: 'Testenine', subcategory: 'Dolge', unit: 'pak', purchasePrice: 1.5, salePrice: 0, minStock: 10, supplier: 'Hofer Cash & Carry' },
  { name: 'Lasagne (500g)', category: 'Testenine', subcategory: 'Listi', unit: 'pak', purchasePrice: 1.8, salePrice: 0, minStock: 5, supplier: 'Hofer Cash & Carry' },
  { name: 'Tortellini (500g)', category: 'Testenine', subcategory: 'Polnjene', unit: 'pak', purchasePrice: 2.5, salePrice: 0, minStock: 5, supplier: 'Hofer Cash & Carry' },
  { name: 'Ravioli (500g)', category: 'Testenine', subcategory: 'Polnjene', unit: 'pak', purchasePrice: 2.8, salePrice: 0, minStock: 5, supplier: 'Hofer Cash & Carry' },
  { name: 'Rižota z morskimi sadeži', category: 'Testenine', subcategory: 'Rižote', unit: 'kos', purchasePrice: 4.0, salePrice: 16.0, minStock: 5, supplier: 'Metro Cash & Carry' },
  { name: 'Rižota z gobami', category: 'Testenine', subcategory: 'Rižote', unit: 'kos', purchasePrice: 2.5, salePrice: 12.0, minStock: 5, supplier: 'Mercator POS' },
  { name: 'Riž (1kg)', category: 'Testenine', subcategory: 'Sestavine', unit: 'kg', purchasePrice: 1.5, salePrice: 0, minStock: 5, supplier: 'Hofer Cash & Carry' },

  // ============ PRILOGE ============
  { name: 'Pomfrit (1kg)', category: 'Priloge', subcategory: 'Krompir', unit: 'kg', purchasePrice: 1.5, salePrice: 3.5, minStock: 5, supplier: 'Hofer Cash & Carry' },
  { name: 'Pečen krompir', category: 'Priloge', subcategory: 'Krompir', unit: 'kg', purchasePrice: 1.0, salePrice: 3.0, minStock: 5, supplier: 'Mercator POS' },
  { name: 'Krompirjeva solata', category: 'Priloge', subcategory: 'Krompir', unit: 'kg', purchasePrice: 2.0, salePrice: 4.0, minStock: 3, supplier: 'Hofer Cash & Carry' },
  { name: 'Riž (porcija)', category: 'Priloge', subcategory: 'Riž', unit: 'kos', purchasePrice: 0.5, salePrice: 2.5, minStock: 20, supplier: 'Hofer Cash & Carry' },
  { name: 'Kruh (beli)', category: 'Priloge', subcategory: 'Kruh', unit: 'kos', purchasePrice: 0.8, salePrice: 2.0, minStock: 10, supplier: 'Mercator POS' },
  { name: 'Kruh (črni)', category: 'Priloge', subcategory: 'Kruh', unit: 'kos', purchasePrice: 0.9, salePrice: 2.2, minStock: 10, supplier: 'Mercator POS' },
  { name: 'Kruh (polnozrnati)', category: 'Priloge', subcategory: 'Kruh', unit: 'kos', purchasePrice: 1.0, salePrice: 2.5, minStock: 10, supplier: 'Mercator POS' },
  { name: 'Tortilje (10kos)', category: 'Priloge', subcategory: 'Kruh', unit: 'pak', purchasePrice: 1.5, salePrice: 0, minStock: 5, supplier: 'Hofer Cash & Carry' },
  { name: 'Ajvar', category: 'Priloge', subcategory: 'Omake', unit: 'kg', purchasePrice: 4.0, salePrice: 0, minStock: 2, supplier: 'Mercator POS' },
  { name: 'Ketchup', category: 'Priloge', subcategory: 'Omake', unit: 'kg', purchasePrice: 2.0, salePrice: 0, minStock: 3, supplier: 'Hofer Cash & Carry' },
  { name: 'Majoneza', category: 'Priloge', subcategory: 'Omake', unit: 'kg', purchasePrice: 3.0, salePrice: 0, minStock: 2, supplier: 'Hofer Cash & Carry' },
  { name: 'Tartar omaka', category: 'Priloge', subcategory: 'Omake', unit: 'kg', purchasePrice: 3.5, salePrice: 0, minStock: 2, supplier: 'Hofer Cash & Carry' },

  // ============ SLADICE ============
  { name: 'Tiramisu', category: 'Sladice', subcategory: 'Italijanske', unit: 'kos', purchasePrice: 2.0, salePrice: 6.5, minStock: 10, supplier: 'Metro Cash & Carry' },
  { name: 'Panna Cotta', category: 'Sladice', subcategory: 'Italijanske', unit: 'kos', purchasePrice: 1.5, salePrice: 5.5, minStock: 10, supplier: 'Metro Cash & Carry' },
  { name: 'Čokoladna torta', category: 'Sladice', subcategory: 'Torte', unit: 'kos', purchasePrice: 2.5, salePrice: 6.0, minStock: 10, supplier: 'Mercator POS' },
  { name: 'Prekmurska gibanica', category: 'Sladice', subcategory: 'Tradicionalne', unit: 'kos', purchasePrice: 2.5, salePrice: 6.0, minStock: 10, supplier: 'Mercator POS' },
  { name: 'Šampinjoni sladica', category: 'Sladice', subcategory: 'Sladke', unit: 'kos', purchasePrice: 2.0, salePrice: 5.5, minStock: 5, supplier: 'Mercator POS' },
  { name: 'Jabolčni zavitek', category: 'Sladice', subcategory: 'Zavitki', unit: 'kos', purchasePrice: 1.5, salePrice: 5.0, minStock: 10, supplier: 'Mercator POS' },
  { name: 'Cheesecake', category: 'Sladice', subcategory: 'Torte', unit: 'kos', purchasePrice: 2.5, salePrice: 6.5, minStock: 10, supplier: 'Metro Cash & Carry' },
  { name: 'Sladoled vanilija (1l)', category: 'Sladice', subcategory: 'Sladoled', unit: 'l', purchasePrice: 3.0, salePrice: 0, minStock: 3, supplier: 'Hofer Cash & Carry' },
  { name: 'Sladoled čokolada (1l)', category: 'Sladice', subcategory: 'Sladoled', unit: 'l', purchasePrice: 3.0, salePrice: 0, minStock: 3, supplier: 'Hofer Cash & Carry' },
  { name: 'Sladoled jagoda (1l)', category: 'Sladice', subcategory: 'Sladoled', unit: 'l', purchasePrice: 3.0, salePrice: 0, minStock: 3, supplier: 'Hofer Cash & Carry' },
  { name: 'Profiteroles', category: 'Sladice', subcategory: 'Sladke', unit: 'kos', purchasePrice: 2.0, salePrice: 5.5, minStock: 5, supplier: 'Metro Cash & Carry' },

  // ============ TOPLE PIJAČE ============
  { name: 'Espresso', category: 'Tople pijače', subcategory: 'Kava', unit: 'kos', purchasePrice: 0.3, salePrice: 1.5, minStock: 100, supplier: 'Barcaffe' },
  { name: 'Becka kava', category: 'Tople pijače', subcategory: 'Kava', unit: 'kos', purchasePrice: 0.5, salePrice: 2.0, minStock: 100, supplier: 'Barcaffe' },
  { name: 'Cappuccino', category: 'Tople pijače', subcategory: 'Kava', unit: 'kos', purchasePrice: 0.5, salePrice: 2.2, minStock: 100, supplier: 'Barcaffe' },
  { name: 'Latte macchiato', category: 'Tople pijače', subcategory: 'Kava', unit: 'kos', purchasePrice: 0.6, salePrice: 2.5, minStock: 100, supplier: 'Barcaffe' },
  { name: 'Kava z mlekom', category: 'Tople pijače', subcategory: 'Kava', unit: 'kos', purchasePrice: 0.4, salePrice: 1.8, minStock: 100, supplier: 'Barcaffe' },
  { name: 'Americano', category: 'Tople pijače', subcategory: 'Kava', unit: 'kos', purchasePrice: 0.4, salePrice: 1.8, minStock: 100, supplier: 'Barcaffe' },
  { name: 'Turška kava', category: 'Tople pijače', subcategory: 'Kava', unit: 'kos', purchasePrice: 0.4, salePrice: 2.0, minStock: 50, supplier: 'Barcaffe' },
  { name: 'Kava zrna (1kg)', category: 'Tople pijače', subcategory: 'Sestavine', unit: 'kg', purchasePrice: 12.0, salePrice: 0, minStock: 3, supplier: 'Barcaffe' },
  { name: 'Črni čaj', category: 'Tople pijače', subcategory: 'Čaji', unit: 'kos', purchasePrice: 0.2, salePrice: 1.8, minStock: 50, supplier: 'Hofer Cash & Carry' },
  { name: 'Zeleni čaj', category: 'Tople pijače', subcategory: 'Čaji', unit: 'kos', purchasePrice: 0.2, salePrice: 1.8, minStock: 50, supplier: 'Hofer Cash & Carry' },
  { name: 'Sadni čaj', category: 'Tople pijače', subcategory: 'Čaji', unit: 'kos', purchasePrice: 0.3, salePrice: 2.0, minStock: 50, supplier: 'Hofer Cash & Carry' },
  { name: 'Kamilica', category: 'Tople pijače', subcategory: 'Čaji', unit: 'kos', purchasePrice: 0.2, salePrice: 1.8, minStock: 30, supplier: 'Hofer Cash & Carry' },
  { name: 'Metin čaj', category: 'Tople pijače', subcategory: 'Čaji', unit: 'kos', purchasePrice: 0.2, salePrice: 1.8, minStock: 30, supplier: 'Hofer Cash & Carry' },
  { name: 'Vroča čokolada', category: 'Tople pijače', subcategory: 'Druge', unit: 'kos', purchasePrice: 0.6, salePrice: 2.5, minStock: 50, supplier: 'Hofer Cash & Carry' },
  { name: 'Mleko (1l)', category: 'Tople pijače', subcategory: 'Sestavine', unit: 'l', purchasePrice: 1.0, salePrice: 0, minStock: 10, supplier: 'Mercator POS' },

  // ============ BREZALKOHOLNE PIJAČE ============
  { name: 'Coca Cola (0.33l)', category: 'Brezalkoholne', subcategory: 'Gazirane', unit: 'kos', purchasePrice: 0.8, salePrice: 2.5, minStock: 48, supplier: 'Coca-Cola HBC' },
  { name: 'Coca Cola (0.5l)', category: 'Brezalkoholne', subcategory: 'Gazirane', unit: 'kos', purchasePrice: 1.0, salePrice: 3.0, minStock: 48, supplier: 'Coca-Cola HBC' },
  { name: 'Coca Cola Zero (0.33l)', category: 'Brezalkoholne', subcategory: 'Gazirane', unit: 'kos', purchasePrice: 0.8, salePrice: 2.5, minStock: 24, supplier: 'Coca-Cola HBC' },
  { name: 'Fanta (0.33l)', category: 'Brezalkoholne', subcategory: 'Gazirane', unit: 'kos', purchasePrice: 0.8, salePrice: 2.5, minStock: 24, supplier: 'Coca-Cola HBC' },
  { name: 'Sprite (0.33l)', category: 'Brezalkoholne', subcategory: 'Gazirane', unit: 'kos', purchasePrice: 0.8, salePrice: 2.5, minStock: 24, supplier: 'Coca-Cola HBC' },
  { name: 'Pipi (0.2l)', category: 'Brezalkoholne', subcategory: 'Sokovi', unit: 'kos', purchasePrice: 0.5, salePrice: 1.8, minStock: 48, supplier: 'Fructal' },
  { name: 'Jabolčni sok (0.2l)', category: 'Brezalkoholne', subcategory: 'Sokovi', unit: 'kos', purchasePrice: 0.5, salePrice: 1.8, minStock: 48, supplier: 'Fructal' },
  { name: 'Pomarančni sok (0.2l)', category: 'Brezalkoholne', subcategory: 'Sokovi', unit: 'kos', purchasePrice: 0.5, salePrice: 1.8, minStock: 48, supplier: 'Fructal' },
  { name: 'Multivitaminski sok (0.2l)', category: 'Brezalkoholne', subcategory: 'Sokovi', unit: 'kos', purchasePrice: 0.6, salePrice: 2.0, minStock: 24, supplier: 'Fructal' },
  { name: 'Ledeni čaj (0.33l)', category: 'Brezalkoholne', subcategory: 'Sokovi', unit: 'kos', purchasePrice: 0.8, salePrice: 2.5, minStock: 24, supplier: 'Fructal' },
  { name: 'Voda Radenska (0.5l)', category: 'Brezalkoholne', subcategory: 'Voda', unit: 'kos', purchasePrice: 0.4, salePrice: 2.0, minStock: 48, supplier: 'Radenska' },
  { name: 'Voda Radenska (0.25l)', category: 'Brezalkoholne', subcategory: 'Voda', unit: 'kos', purchasePrice: 0.3, salePrice: 1.8, minStock: 48, supplier: 'Radenska' },
  { name: 'Voda Dana (0.5l)', category: 'Brezalkoholne', subcategory: 'Voda', unit: 'kos', purchasePrice: 0.3, salePrice: 1.8, minStock: 48, supplier: 'Dana' },
  { name: 'Voda (steklenica 0.75l)', category: 'Brezalkoholne', subcategory: 'Voda', unit: 'kos', purchasePrice: 0.8, salePrice: 3.0, minStock: 24, supplier: 'Radenska' },
  { name: 'Red Bull (0.25l)', category: 'Brezalkoholne', subcategory: 'Energijske', unit: 'kos', purchasePrice: 1.2, salePrice: 3.5, minStock: 24, supplier: 'Red Bull' },
  { name: 'Monster (0.5l)', category: 'Brezalkoholne', subcategory: 'Energijske', unit: 'kos', purchasePrice: 1.5, salePrice: 4.0, minStock: 12, supplier: 'Monster Energy' },

  // ============ PIVO ============
  { name: 'Laško Zlatorog (0.5l)', category: 'Pivo', subcategory: 'Točeno', unit: 'kos', purchasePrice: 1.0, salePrice: 3.0, minStock: 48, supplier: 'Pivovarna Laško' },
  { name: 'Laško Union (0.5l)', category: 'Pivo', subcategory: 'Točeno', unit: 'kos', purchasePrice: 1.0, salePrice: 3.0, minStock: 48, supplier: 'Pivovarna Laško' },
  { name: 'Laško Zlatorog (0.33l steklo)', category: 'Pivo', subcategory: 'Steklenično', unit: 'kos', purchasePrice: 0.9, salePrice: 2.8, minStock: 48, supplier: 'Pivovarna Laško' },
  { name: 'Laško Union (0.33l steklo)', category: 'Pivo', subcategory: 'Steklenično', unit: 'kos', purchasePrice: 0.9, salePrice: 2.8, minStock: 48, supplier: 'Pivovarna Laško' },
  { name: 'Heineken (0.33l)', category: 'Pivo', subcategory: 'Steklenično', unit: 'kos', purchasePrice: 1.0, salePrice: 3.2, minStock: 24, supplier: 'Heineken' },
  { name: 'Corona (0.33l)', category: 'Pivo', subcategory: 'Steklenično', unit: 'kos', purchasePrice: 1.3, salePrice: 3.8, minStock: 24, supplier: 'Corona' },
  { name: 'Stella Artois (0.33l)', category: 'Pivo', subcategory: 'Steklenično', unit: 'kos', purchasePrice: 1.1, salePrice: 3.5, minStock: 24, supplier: 'Stella Artois' },
  { name: 'Karlovacko (0.33l)', category: 'Pivo', subcategory: 'Steklenično', unit: 'kos', purchasePrice: 0.9, salePrice: 3.0, minStock: 24, supplier: 'Karlovacko' },
  { name: 'Bavarsko pivo (0.5l)', category: 'Pivo', subcategory: 'Steklenično', unit: 'kos', purchasePrice: 1.3, salePrice: 4.0, minStock: 24, supplier: 'Metro Cash & Carry' },
  { name: 'Temno pivo (0.33l)', category: 'Pivo', subcategory: 'Steklenično', unit: 'kos', purchasePrice: 1.2, salePrice: 3.5, minStock: 12, supplier: 'Pivovarna Laško' },
  { name: 'Bezgov pivo (0.33l)', category: 'Pivo', subcategory: 'Sadno', unit: 'kos', purchasePrice: 1.0, salePrice: 3.2, minStock: 12, supplier: 'Pivovarna Laško' },
  { name: 'Radler (0.33l)', category: 'Pivo', subcategory: 'Sadno', unit: 'kos', purchasePrice: 0.9, salePrice: 2.8, minStock: 24, supplier: 'Pivovarna Laško' },

  // ============ VINO ============
  { name: 'Modra Frankinja (0.2l)', category: 'Vino', subcategory: 'Rdeče', unit: 'kos', purchasePrice: 1.5, salePrice: 4.0, minStock: 20, supplier: 'Vinska klet Goriska Brda' },
  { name: 'Merlot (0.2l)', category: 'Vino', subcategory: 'Rdeče', unit: 'kos', purchasePrice: 1.5, salePrice: 4.0, minStock: 20, supplier: 'Vinska klet Goriska Brda' },
  { name: 'Cabernet Sauvignon (0.2l)', category: 'Vino', subcategory: 'Rdeče', unit: 'kos', purchasePrice: 1.8, salePrice: 4.5, minStock: 20, supplier: 'Vinska klet Goriska Brda' },
  { name: 'Refosk (0.2l)', category: 'Vino', subcategory: 'Rdeče', unit: 'kos', purchasePrice: 1.5, salePrice: 4.0, minStock: 20, supplier: 'Vinska klet Goriska Brda' },
  { name: 'Šipon (0.2l)', category: 'Vino', subcategory: 'Belo', unit: 'kos', purchasePrice: 1.3, salePrice: 3.5, minStock: 20, supplier: 'Vinska klet Goriska Brda' },
  { name: 'Laški Rizling (0.2l)', category: 'Vino', subcategory: 'Belo', unit: 'kos', purchasePrice: 1.3, salePrice: 3.5, minStock: 20, supplier: 'Vinska klet Goriska Brda' },
  { name: 'Chardonnay (0.2l)', category: 'Vino', subcategory: 'Belo', unit: 'kos', purchasePrice: 1.5, salePrice: 4.0, minStock: 20, supplier: 'Vinska klet Goriska Brda' },
  { name: 'Sauvignon (0.2l)', category: 'Vino', subcategory: 'Belo', unit: 'kos', purchasePrice: 1.5, salePrice: 4.0, minStock: 20, supplier: 'Vinska klet Goriska Brda' },
  { name: 'Penina (0.1l)', category: 'Vino', subcategory: 'Peneče', unit: 'kos', purchasePrice: 2.0, salePrice: 5.0, minStock: 10, supplier: 'Vinska klet Goriska Brda' },
  { name: 'Rumena Muškat (0.2l)', category: 'Vino', subcategory: 'Sladko', unit: 'kos', purchasePrice: 1.8, salePrice: 4.5, minStock: 10, supplier: 'Vinska klet Goriska Brda' },
  { name: 'Vino bottle (0.75l) - Modra Frankinja', category: 'Vino', subcategory: 'Steklenice', unit: 'kos', purchasePrice: 8.0, salePrice: 18.0, minStock: 6, supplier: 'Vinska klet Goriska Brda' },
  { name: 'Vino bottle (0.75l) - Merlot', category: 'Vino', subcategory: 'Steklenice', unit: 'kos', purchasePrice: 8.0, salePrice: 18.0, minStock: 6, supplier: 'Vinska klet Goriska Brda' },
  { name: 'Vino bottle (0.75l) - Chardonnay', category: 'Vino', subcategory: 'Steklenice', unit: 'kos', purchasePrice: 9.0, salePrice: 20.0, minStock: 6, supplier: 'Vinska klet Goriska Brda' },

  // ============ ŽGANE PIJAČE ============
  { name: 'Pelinkovac (0.04l)', category: 'Žgane pijače', subcategory: 'Likirji', unit: 'kos', purchasePrice: 0.8, salePrice: 3.0, minStock: 20, supplier: 'Badel' },
  { name: 'Jegermeister (0.04l)', category: 'Žgane pijače', subcategory: 'Likirji', unit: 'kos', purchasePrice: 1.0, salePrice: 3.5, minStock: 20, supplier: 'Jägermeister' },
  { name: 'Rum (0.04l)', category: 'Žgane pijače', subcategory: 'Žgane', unit: 'kos', purchasePrice: 0.8, salePrice: 3.0, minStock: 20, supplier: 'Bacardi' },
  { name: 'Vodka (0.04l)', category: 'Žgane pijače', subcategory: 'Žgane', unit: 'kos', purchasePrice: 0.7, salePrice: 2.8, minStock: 20, supplier: 'Absolut' },
  { name: 'Gin (0.04l)', category: 'Žgane pijače', subcategory: 'Žgane', unit: 'kos', purchasePrice: 0.9, salePrice: 3.2, minStock: 20, supplier: 'Gordon' },
  { name: 'Whiskey (0.04l)', category: 'Žgane pijače', subcategory: 'Žgane', unit: 'kos', purchasePrice: 1.2, salePrice: 3.8, minStock: 20, supplier: 'Jameson' },
  { name: 'Bourbon (0.04l)', category: 'Žgane pijače', subcategory: 'Žgane', unit: 'kos', purchasePrice: 1.3, salePrice: 4.0, minStock: 15, supplier: 'Jack Daniels' },
  { name: 'Tequila (0.04l)', category: 'Žgane pijače', subcategory: 'Žgane', unit: 'kos', purchasePrice: 1.0, salePrice: 3.5, minStock: 15, supplier: 'Jose Cuervo' },
  { name: 'Konjak (0.04l)', category: 'Žgane pijače', subcategory: 'Žgane', unit: 'kos', purchasePrice: 1.1, salePrice: 3.5, minStock: 15, supplier: 'Metaxa' },
  { name: 'Slivovka (0.04l)', category: 'Žgane pijače', subcategory: 'Sadno žganje', unit: 'kos', purchasePrice: 0.9, salePrice: 3.2, minStock: 15, supplier: 'Lokalno žganje' },
  { name: 'Hruškovce (0.04l)', category: 'Žgane pijače', subcategory: 'Sadno žganje', unit: 'kos', purchasePrice: 0.9, salePrice: 3.2, minStock: 15, supplier: 'Lokalno žganje' },
  { name: 'Terasenjevo žganje (0.04l)', category: 'Žgane pijače', subcategory: 'Sadno žganje', unit: 'kos', purchasePrice: 0.9, salePrice: 3.2, minStock: 15, supplier: 'Lokalno žganje' },
  { name: 'Brbonjska vodca (0.04l)', category: 'Žgane pijače', subcategory: 'Sadno žganje', unit: 'kos', purchasePrice: 1.0, salePrice: 3.5, minStock: 15, supplier: 'Lokalno žganje' },
  { name: 'Aperol (0.04l)', category: 'Žgane pijače', subcategory: 'Likirji', unit: 'kos', purchasePrice: 0.9, salePrice: 3.2, minStock: 20, supplier: 'Aperol' },
  { name: 'Campari (0.04l)', category: 'Žgane pijače', subcategory: 'Likirji', unit: 'kos', purchasePrice: 0.9, salePrice: 3.2, minStock: 20, supplier: 'Campari' },
  { name: 'Baileys (0.04l)', category: 'Žgane pijače', subcategory: 'Likirji', unit: 'kos', purchasePrice: 1.0, salePrice: 3.5, minStock: 15, supplier: 'Baileys' },
  { name: 'Amaretto (0.04l)', category: 'Žgane pijače', subcategory: 'Likirji', unit: 'kos', purchasePrice: 0.9, salePrice: 3.2, minStock: 15, supplier: 'Amaretto' },

  // ============ KOKTAJLI ============
  { name: 'Mojito', category: 'Koktajli', subcategory: 'Rum', unit: 'kos', purchasePrice: 2.5, salePrice: 6.5, minStock: 10, supplier: 'Metro Cash & Carry' },
  { name: 'Aperol Spritz', category: 'Koktajli', subcategory: 'Aperitiv', unit: 'kos', purchasePrice: 2.0, salePrice: 6.0, minStock: 10, supplier: 'Metro Cash & Carry' },
  { name: 'Gin Tonic', category: 'Koktajli', subcategory: 'Gin', unit: 'kos', purchasePrice: 2.0, salePrice: 5.5, minStock: 10, supplier: 'Metro Cash & Carry' },
  { name: 'Cuba Libre', category: 'Koktajli', subcategory: 'Rum', unit: 'kos', purchasePrice: 2.2, salePrice: 5.8, minStock: 10, supplier: 'Metro Cash & Carry' },
  { name: 'Margarita', category: 'Koktajli', subcategory: 'Tequila', unit: 'kos', purchasePrice: 2.5, salePrice: 6.5, minStock: 10, supplier: 'Metro Cash & Carry' },
  { name: 'Pina Colada', category: 'Koktajli', subcategory: 'Rum', unit: 'kos', purchasePrice: 2.5, salePrice: 6.5, minStock: 10, supplier: 'Metro Cash & Carry' },
  { name: 'Cosmopolitan', category: 'Koktajli', subcategory: 'Vodka', unit: 'kos', purchasePrice: 2.5, salePrice: 6.5, minStock: 10, supplier: 'Metro Cash & Carry' },
  { name: 'Negroni', category: 'Koktajli', subcategory: 'Aperitiv', unit: 'kos', purchasePrice: 2.3, salePrice: 6.2, minStock: 10, supplier: 'Metro Cash & Carry' },

  // ============ EMBALAŽA ============
  { name: 'Račun papir (80mm)', category: 'Embalaža', subcategory: 'Tisk', unit: 'rola', purchasePrice: 3.0, salePrice: 0, minStock: 5, supplier: 'Metro Cash & Carry', description: 'Termalni papir 80x80mm' },
  { name: 'Račun papir (58mm)', category: 'Embalaža', subcategory: 'Tisk', unit: 'rola', purchasePrice: 2.5, salePrice: 0, minStock: 5, supplier: 'Metro Cash & Carry' },
  { name: 'A4 papir (500 listov)', category: 'Embalaža', subcategory: 'Tisk', unit: 'pak', purchasePrice: 4.0, salePrice: 0, minStock: 5, supplier: 'Hofer Cash & Carry' },
  { name: 'Plastična vrečka (50kos)', category: 'Embalaža', subcategory: 'Vrečke', unit: 'pak', purchasePrice: 2.0, salePrice: 0, minStock: 10, supplier: 'Hofer Cash & Carry' },
  { name: 'Papirnata vrečka (50kos)', category: 'Embalaža', subcategory: 'Vrečke', unit: 'pak', purchasePrice: 3.0, salePrice: 0, minStock: 5, supplier: 'Hofer Cash & Carry' },
  { name: 'Škatla za hrano (100kos)', category: 'Embalaža', subcategory: 'Škatle', unit: 'pak', purchasePrice: 8.0, salePrice: 0, minStock: 5, supplier: 'Metro Cash & Carry' },
  { name: 'Alu folija (50m)', category: 'Embalaža', subcategory: 'Folije', unit: 'rola', purchasePrice: 3.5, salePrice: 0, minStock: 5, supplier: 'Hofer Cash & Carry' },
  { name: 'Prozorna folija (300m)', category: 'Embalaža', subcategory: 'Folije', unit: 'rola', purchasePrice: 2.5, salePrice: 0, minStock: 3, supplier: 'Hofer Cash & Carry' },
  { name: 'Kozarec 0.2l (50kos)', category: 'Embalaža', subcategory: 'Kozarci', unit: 'pak', purchasePrice: 4.0, salePrice: 0, minStock: 5, supplier: 'Metro Cash & Carry' },
  { name: 'Kozarec 0.3l (50kos)', category: 'Embalaža', subcategory: 'Kozarci', unit: 'pak', purchasePrice: 5.0, salePrice: 0, minStock: 5, supplier: 'Metro Cash & Carry' },
  { name: 'Kozarec 0.5l (50kos)', category: 'Embalaža', subcategory: 'Kozarci', unit: 'pak', purchasePrice: 6.0, salePrice: 0, minStock: 5, supplier: 'Metro Cash & Carry' },
  { name: 'Vinska kozarca (12kos)', category: 'Embalaža', subcategory: 'Kozarci', unit: 'pak', purchasePrice: 15.0, salePrice: 0, minStock: 3, supplier: 'Metro Cash & Carry' },
  { name: 'Pivska kozarca (12kos)', category: 'Embalaža', subcategory: 'Kozarci', unit: 'pak', purchasePrice: 12.0, salePrice: 0, minStock: 3, supplier: 'Metro Cash & Carry' },
  { name: 'Sladica krožnik (50kos)', category: 'Embalaža', subcategory: 'Krožniki', unit: 'pak', purchasePrice: 8.0, salePrice: 0, minStock: 5, supplier: 'Metro Cash & Carry' },
  { name: 'Pladanj (50kos)', category: 'Embalaža', subcategory: 'Krožniki', unit: 'pak', purchasePrice: 10.0, salePrice: 0, minStock: 3, supplier: 'Metro Cash & Carry' },
  { name: 'Cev za pijačo (500kos)', category: 'Embalaža', subcategory: 'Pribor', unit: 'pak', purchasePrice: 2.0, salePrice: 0, minStock: 5, supplier: 'Hofer Cash & Carry' },
  { name: 'Mešalka (500kos)', category: 'Embalaža', subcategory: 'Pribor', unit: 'pak', purchasePrice: 2.5, salePrice: 0, minStock: 5, supplier: 'Hofer Cash & Carry' },
  { name: 'Zobotrebci (1000kos)', category: 'Embalaža', subcategory: 'Pribor', unit: 'pak', purchasePrice: 3.0, salePrice: 0, minStock: 5, supplier: 'Hofer Cash & Carry' },

  // ============ PRIBOR ============
  { name: 'Noži kuhinjski (set)', category: 'Pribor', subcategory: 'Kuhinja', unit: 'kos', purchasePrice: 50.0, salePrice: 0, minStock: 2, supplier: 'Metro Cash & Carry' },
  { name: 'Deske za rezanje (3kos)', category: 'Pribor', subcategory: 'Kuhinja', unit: 'pak', purchasePrice: 20.0, salePrice: 0, minStock: 2, supplier: 'Metro Cash & Carry' },
  { name: 'Lonec 20L', category: 'Pribor', subcategory: 'Kuhinja', unit: 'kos', purchasePrice: 35.0, salePrice: 0, minStock: 1, supplier: 'Metro Cash & Carry' },
  { name: ' ponev 40cm', category: 'Pribor', subcategory: 'Kuhinja', unit: 'kos', purchasePrice: 30.0, salePrice: 0, minStock: 2, supplier: 'Metro Cash & Carry' },
  { name: 'Pečeč plošča', category: 'Pribor', subcategory: 'Kuhinja', unit: 'kos', purchasePrice: 25.0, salePrice: 0, minStock: 2, supplier: 'Metro Cash & Carry' },
  { name: 'Cedilo', category: 'Pribor', subcategory: 'Kuhinja', unit: 'kos', purchasePrice: 8.0, salePrice: 0, minStock: 2, supplier: 'Metro Cash & Carry' },
  { name: 'Metlica', category: 'Pribor', subcategory: 'Kuhinja', unit: 'kos', purchasePrice: 5.0, salePrice: 0, minStock: 3, supplier: 'Metro Cash & Carry' },
  { name: 'Lopatica', category: 'Pribor', subcategory: 'Kuhinja', unit: 'kos', purchasePrice: 4.0, salePrice: 0, minStock: 3, supplier: 'Metro Cash & Carry' },
  { name: 'Stresalo za pico', category: 'Pribor', subcategory: 'Pica', unit: 'kos', purchasePrice: 15.0, salePrice: 0, minStock: 2, supplier: 'Metro Cash & Carry' },
  { name: 'Nož za pico', category: 'Pribor', subcategory: 'Pica', unit: 'kos', purchasePrice: 12.0, salePrice: 0, minStock: 2, supplier: 'Metro Cash & Carry' },

  // ============ ČISTILA ============
  { name: 'Univerzalno čistilo (5L)', category: 'Čistila', subcategory: 'Tekoča', unit: 'kos', purchasePrice: 8.0, salePrice: 0, minStock: 5, supplier: 'Hofer Cash & Carry' },
  { name: 'Čistilo za steklo (5L)', category: 'Čistila', subcategory: 'Tekoča', unit: 'kos', purchasePrice: 6.0, salePrice: 0, minStock: 3, supplier: 'Hofer Cash & Carry' },
  { name: 'Čistilo za tla (5L)', category: 'Čistila', subcategory: 'Tekoča', unit: 'kos', purchasePrice: 7.0, salePrice: 0, minStock: 3, supplier: 'Hofer Cash & Carry' },
  { name: 'Razmaščevalec (5L)', category: 'Čistila', subcategory: 'Tekoča', unit: 'kos', purchasePrice: 12.0, salePrice: 0, minStock: 3, supplier: 'Metro Cash & Carry' },
  { name: 'Robčki (6 rolo)', category: 'Čistila', subcategory: 'Robčki', unit: 'pak', purchasePrice: 8.0, salePrice: 0, minStock: 5, supplier: 'Hofer Cash & Carry' },
  { name: 'Toaletni papir (24 rolo)', category: 'Čistila', subcategory: 'Robčki', unit: 'pak', purchasePrice: 12.0, salePrice: 0, minStock: 5, supplier: 'Hofer Cash & Carry' },
  { name: 'Krpice za čiščenje (10kos)', category: 'Čistila', subcategory: 'Pribor', unit: 'pak', purchasePrice: 5.0, salePrice: 0, minStock: 3, supplier: 'Hofer Cash & Carry' },
  { name: 'Rokavice (100kos)', category: 'Čistila', subcategory: 'Pribor', unit: 'pak', purchasePrice: 6.0, salePrice: 0, minStock: 3, supplier: 'Metro Cash & Carry' },
  { name: 'Vrečke za smeti (50kos)', category: 'Čistila', subcategory: 'Vrečke', unit: 'pak', purchasePrice: 4.0, salePrice: 0, minStock: 10, supplier: 'Hofer Cash & Carry' },
  { name: 'Pralno sredstvo (5kg)', category: 'Čistila', subcategory: 'Pralno', unit: 'kos', purchasePrice: 15.0, salePrice: 0, minStock: 2, supplier: 'Hofer Cash & Carry' },
]

/**
 * Get all categories with counts
 */
export function getCategoryStats() {
  const stats: Record<string, number> = {}
  for (const item of SEED_ITEMS) {
    stats[item.category] = (stats[item.category] || 0) + 1
  }
  return stats
}
