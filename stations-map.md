# 🗺️ Карта станций КБШ Н-122

## Основные участки

```mermaid
graph LR
    %% Стилизация
    classDef station fill:#1976D2,color:#fff,stroke:#0D47A1,stroke-width:2px
    classDef peregon fill:#388E3C,color:#fff,stroke:#1B5E20,stroke-width:1px
    classDef section fill:#F57C00,color:#fff,stroke:#E65100,stroke-width:3px

    %% Участок 1638 км- Шугуровка
    subgraph Section0["📍 1638 км- Шугуровка"]
        class Section0 section

        Pp_1638_km_0["🚉 Пп 1638 км"]
        class Pp_1638_km_0 station
        Pp_1638_km_Shugurovka_0["⮊ Пп 1638 км - Шугуровка"]
        class Pp_1638_km_Shugurovka_0 peregon
        Pp_1638_km_0 --> Pp_1638_km_Shugurovka_0
        Shugurovka_0["🚉 Шугуровка"]
        class Shugurovka_0 station
        Pp_1638_km_Shugurovka_0 --> Shugurovka_0
    end

    %% Участок Акбаш-Алнаши
    subgraph Section1["📍 Акбаш-Алнаши"]
        class Section1 section

        Akbash_1["🚉 Акбаш"]
        class Akbash_1 station
        Shugurovka_0 --> Akbash_1
        Akbash_Akkul_1["⮊ Акбаш - Аккуль"]
        class Akbash_Akkul_1 peregon
        Akbash_1 --> Akbash_Akkul_1
        Akkul_1["🚉 Аккуль"]
        class Akkul_1 station
        Akbash_Akkul_1 --> Akkul_1
        Akkul_Yalan_1["⮊ Аккуль - Ялан"]
        class Akkul_Yalan_1 peregon
        Akkul_1 --> Akkul_Yalan_1
        Yalan_1["🚉 Ялан"]
        class Yalan_1 station
        Akkul_Yalan_1 --> Yalan_1
        Yalan_Pismyanka_1["⮊ Ялан - Письмянка"]
        class Yalan_Pismyanka_1 peregon
        Yalan_1 --> Yalan_Pismyanka_1
        Pismyanka_1["🚉 Письмянка"]
        class Pismyanka_1 station
        Yalan_Pismyanka_1 --> Pismyanka_1
        Pismyanka_Vatan_1["⮊ Письмянка - Ватан"]
        class Pismyanka_Vatan_1 peregon
        Pismyanka_1 --> Pismyanka_Vatan_1
        Vatan_1["🚉 Ватан"]
        class Vatan_1 station
        Pismyanka_Vatan_1 --> Vatan_1
        Vatan_Minnibaevo_1["⮊ Ватан - Миннибаево"]
        class Vatan_Minnibaevo_1 peregon
        Vatan_1 --> Vatan_Minnibaevo_1
        Minnibaevo_1["🚉 Миннибаево"]
        class Minnibaevo_1 station
        Vatan_Minnibaevo_1 --> Minnibaevo_1
        Minnibaevo_Kulsharipovo_1["⮊ Миннибаево - Кульшарипово"]
        class Minnibaevo_Kulsharipovo_1 peregon
        Minnibaevo_1 --> Minnibaevo_Kulsharipovo_1
        Kulsharipovo_1["🚉 Кульшарипово"]
        class Kulsharipovo_1 station
        Minnibaevo_Kulsharipovo_1 --> Kulsharipovo_1
        Kulsharipovo_Almetevskaya_1["⮊ Кульшарипово - Альметьевская"]
        class Kulsharipovo_Almetevskaya_1 peregon
        Kulsharipovo_1 --> Kulsharipovo_Almetevskaya_1
        Almetevskaya_1["🚉 Альметьевская"]
        class Almetevskaya_1 station
        Kulsharipovo_Almetevskaya_1 --> Almetevskaya_1
        Almetevskaya_Aktash_1["⮊ Альметьевская - Акташ"]
        class Almetevskaya_Aktash_1 peregon
        Almetevskaya_1 --> Almetevskaya_Aktash_1
        Aktash_1["🚉 Акташ"]
        class Aktash_1 station
        Almetevskaya_Aktash_1 --> Aktash_1
        Aktash_Mavrino_1["⮊ Акташ - Маврино"]
        class Aktash_Mavrino_1 peregon
        Aktash_1 --> Aktash_Mavrino_1
        Mavrino_1["🚉 Маврино"]
        class Mavrino_1 station
        Aktash_Mavrino_1 --> Mavrino_1
        Mavrino_Svetloe_Ozero_1["⮊ Маврино - Светлое Озеро"]
        class Mavrino_Svetloe_Ozero_1 peregon
        Mavrino_1 --> Mavrino_Svetloe_Ozero_1
        Svetloe_Ozero_1["🚉 Светлое Озеро"]
        class Svetloe_Ozero_1 station
        Mavrino_Svetloe_Ozero_1 --> Svetloe_Ozero_1
        Svetloe_Ozero_Zainsk_1["⮊ Светлое Озеро - Заинск"]
        class Svetloe_Ozero_Zainsk_1 peregon
        Svetloe_Ozero_1 --> Svetloe_Ozero_Zainsk_1
        Zainsk_1["🚉 Заинск"]
        class Zainsk_1 station
        Svetloe_Ozero_Zainsk_1 --> Zainsk_1
        Zainsk_Zycha_1["⮊ Заинск - Зыча"]
        class Zainsk_Zycha_1 peregon
        Zainsk_1 --> Zainsk_Zycha_1
        Zycha_1["🚉 Зыча"]
        class Zycha_1 station
        Zainsk_Zycha_1 --> Zycha_1
        Zycha_Begishevo_1["⮊ Зыча - Бегишево"]
        class Zycha_Begishevo_1 peregon
        Zycha_1 --> Zycha_Begishevo_1
        Begishevo_1["🚉 Бегишево"]
        class Begishevo_1 station
        Zycha_Begishevo_1 --> Begishevo_1
        Begishevo_Nikashnovka_1["⮊ Бегишево - Никашновка"]
        class Begishevo_Nikashnovka_1 peregon
        Begishevo_1 --> Begishevo_Nikashnovka_1
        Nikashnovka_1["🚉 Никашновка"]
        class Nikashnovka_1 station
        Begishevo_Nikashnovka_1 --> Nikashnovka_1
        Nikashnovka_Krugloe_Pole_1["⮊ Никашновка - Круглое Поле"]
        class Nikashnovka_Krugloe_Pole_1 peregon
        Nikashnovka_1 --> Nikashnovka_Krugloe_Pole_1
        Krugloe_Pole_1["🚉 Круглое Поле"]
        class Krugloe_Pole_1 station
        Nikashnovka_Krugloe_Pole_1 --> Krugloe_Pole_1
        Krugloe_Pole_Naberezh_Chelny_1["⮊ Круглое Поле - Набереж Челны"]
        class Krugloe_Pole_Naberezh_Chelny_1 peregon
        Krugloe_Pole_1 --> Krugloe_Pole_Naberezh_Chelny_1
        Naberezhnye_Chelny_1["🚉 Набережные Челны"]
        class Naberezhnye_Chelny_1 station
        Krugloe_Pole_Naberezh_Chelny_1 --> Naberezhnye_Chelny_1
        Naberezhnye_Chelny_Tihonovo_1["⮊ Набережные Челны - Тихоново"]
        class Naberezhnye_Chelny_Tihonovo_1 peregon
        Naberezhnye_Chelny_1 --> Naberezhnye_Chelny_Tihonovo_1
        Tihonovo_1["🚉 Тихоново"]
        class Tihonovo_1 station
        Naberezhnye_Chelny_Tihonovo_1 --> Tihonovo_1
        Tihonovo_Toyma_1["⮊ Тихоново - Тойма"]
        class Tihonovo_Toyma_1 peregon
        Tihonovo_1 --> Tihonovo_Toyma_1
        Toyma_1["🚉 Тойма"]
        class Toyma_1 station
        Tihonovo_Toyma_1 --> Toyma_1
        Toyma_Alnashi_1["⮊ Тойма - Алнаши"]
        class Toyma_Alnashi_1 peregon
        Toyma_1 --> Toyma_Alnashi_1
    end

    %% Участок Балашов - Пенза I
    subgraph Section2["📍 Балашов - Пенза I"]
        class Section2 section

        Post_463_km_Penza_III_2["⮊ Пост 463 км -Пенза III"]
        class Post_463_km_Penza_III_2 peregon
        Toyma_Alnashi_1 --> Post_463_km_Penza_III_2
        Penza_III_2["🚉 Пенза III"]
        class Penza_III_2 station
        Post_463_km_Penza_III_2 --> Penza_III_2
        Penza_III_Krivozerovka_Zarechnyy_park_2["🚉 Пенза III Кривозеровка - Заречный парк"]
        class Penza_III_Krivozerovka_Zarechnyy_park_2 station
        Penza_III_2 --> Penza_III_Krivozerovka_Zarechnyy_park_2
        Penza_III_Zarechnyy_park_2["🚉 Пенза III Заречный парк"]
        class Penza_III_Zarechnyy_park_2 station
        Penza_III_Krivozerovka_Zarechnyy_park_2 --> Penza_III_Zarechnyy_park_2
        Penza_III_2["🚉 Пенза III"]
        class Penza_III_2 station
        Penza_III_Zarechnyy_park_2 --> Penza_III_2
        Penza_III_2["🚉 Пенза III"]
        class Penza_III_2 station
        Penza_III_2 --> Penza_III_2
        Penza_III_Penza_I_2["⮊ Пенза III - Пенза I"]
        class Penza_III_Penza_I_2 peregon
        Penza_III_2 --> Penza_III_Penza_I_2
        Penza_I_2["🚉 Пенза I"]
        class Penza_I_2 station
        Penza_III_Penza_I_2 --> Penza_I_2
    end

    %% Участок Безенчук-Кинель
    subgraph Section3["📍 Безенчук-Кинель"]
        class Section3 section

        Bezenchuk_3["🚉 Безенчук"]
        class Bezenchuk_3 station
        Penza_I_2 --> Bezenchuk_3
        Bezenchuk_Bp_4_km_3["⮊ Безенчук - Бп 4 км"]
        class Bezenchuk_Bp_4_km_3 peregon
        Bezenchuk_3 --> Bezenchuk_Bp_4_km_3
        Bp_4_km_3["🚉 Бп 4 км"]
        class Bp_4_km_3 station
        Bezenchuk_Bp_4_km_3 --> Bp_4_km_3
        Bp_4_km_Bp_12_km_3["⮊ Бп 4 км - Бп 12 км"]
        class Bp_4_km_Bp_12_km_3 peregon
        Bp_4_km_3 --> Bp_4_km_Bp_12_km_3
        Bp_12_km_3["🚉 Бп 12 км"]
        class Bp_12_km_3 station
        Bp_4_km_Bp_12_km_3 --> Bp_12_km_3
        Bp_12_km_Bp_17_km_3["⮊ Бп 12 км - Бп 17 км"]
        class Bp_12_km_Bp_17_km_3 peregon
        Bp_12_km_3 --> Bp_12_km_Bp_17_km_3
        Bp_17_km_3["🚉 Бп 17 км"]
        class Bp_17_km_3 station
        Bp_12_km_Bp_17_km_3 --> Bp_17_km_3
        Bp_17_km_Bp_27_km_3["⮊ Бп 17 км - Бп 27 км"]
        class Bp_17_km_Bp_27_km_3 peregon
        Bp_17_km_3 --> Bp_17_km_Bp_27_km_3
        Bp_27_km_3["🚉 Бп 27 км"]
        class Bp_27_km_3 station
        Bp_17_km_Bp_27_km_3 --> Bp_27_km_3
        Bp_27_km_Bp_32_km_3["⮊ Бп 27 км - Бп 32 км"]
        class Bp_27_km_Bp_32_km_3 peregon
        Bp_27_km_3 --> Bp_27_km_Bp_32_km_3
        Bp_32_km_3["🚉 Бп 32 км"]
        class Bp_32_km_3 station
        Bp_27_km_Bp_32_km_3 --> Bp_32_km_3
        Bp_32_km_Bp_43_km_3["⮊ Бп 32 км - Бп 43 км"]
        class Bp_32_km_Bp_43_km_3 peregon
        Bp_32_km_3 --> Bp_32_km_Bp_43_km_3
        Bp_43_km_3["🚉 Бп 43 км"]
        class Bp_43_km_3 station
        Bp_32_km_Bp_43_km_3 --> Bp_43_km_3
        Bp_43_km_Bp_48_km_3["⮊ Бп 43 км - Бп 48 км"]
        class Bp_43_km_Bp_48_km_3 peregon
        Bp_43_km_3 --> Bp_43_km_Bp_48_km_3
        Bp_48_km_3["🚉 Бп 48 км"]
        class Bp_48_km_3 station
        Bp_43_km_Bp_48_km_3 --> Bp_48_km_3
        Bp_48_km_Bp_57_km_3["⮊ Бп 48 км - Бп 57 км"]
        class Bp_48_km_Bp_57_km_3 peregon
        Bp_48_km_3 --> Bp_48_km_Bp_57_km_3
        Bp_57_km_3["🚉 Бп 57 км"]
        class Bp_57_km_3 station
        Bp_48_km_Bp_57_km_3 --> Bp_57_km_3
        Bp_57_km_Bp_63_km_3["⮊ Бп 57 км - Бп 63 км"]
        class Bp_57_km_Bp_63_km_3 peregon
        Bp_57_km_3 --> Bp_57_km_Bp_63_km_3
        Bp_63_km_3["🚉 Бп 63 км"]
        class Bp_63_km_3 station
        Bp_57_km_Bp_63_km_3 --> Bp_63_km_3
        Bp_63_km_Bp_74_km_3["⮊ Бп 63 км - Бп 74 км"]
        class Bp_63_km_Bp_74_km_3 peregon
        Bp_63_km_3 --> Bp_63_km_Bp_74_km_3
        Bp_74_km_3["🚉 Бп 74 км"]
        class Bp_74_km_3 station
        Bp_63_km_Bp_74_km_3 --> Bp_74_km_3
        Bp_74_km_Bp_79_km_3["⮊ Бп 74 км - Бп 79 км"]
        class Bp_74_km_Bp_79_km_3 peregon
        Bp_74_km_3 --> Bp_74_km_Bp_79_km_3
        Bp_79_km_3["🚉 Бп 79 км"]
        class Bp_79_km_3 station
        Bp_74_km_Bp_79_km_3 --> Bp_79_km_3
        Bp_79_km_Bp_89_km_3["⮊ Бп 79 км - Бп 89 км"]
        class Bp_79_km_Bp_89_km_3 peregon
        Bp_79_km_3 --> Bp_79_km_Bp_89_km_3
        Bp_89_km_3["🚉 Бп 89 км"]
        class Bp_89_km_3 station
        Bp_79_km_Bp_89_km_3 --> Bp_89_km_3
        Bp_89_km_Bp_94_km_3["⮊ Бп 89 км - Бп 94 км"]
        class Bp_89_km_Bp_94_km_3 peregon
        Bp_89_km_3 --> Bp_89_km_Bp_94_km_3
        Bp_94_km_3["🚉 Бп 94 км"]
        class Bp_94_km_3 station
        Bp_89_km_Bp_94_km_3 --> Bp_94_km_3
        Bp_94_km_Bp_103_km_3["⮊ Бп 94 км - Бп 103 км"]
        class Bp_94_km_Bp_103_km_3 peregon
        Bp_94_km_3 --> Bp_94_km_Bp_103_km_3
        Bp_103_km_Kinel_3["⮊ Бп 103 км - Кинель"]
        class Bp_103_km_Kinel_3 peregon
        Bp_94_km_Bp_103_km_3 --> Bp_103_km_Kinel_3
        Kinel_3["🚉 Кинель"]
        class Kinel_3 station
        Bp_103_km_Kinel_3 --> Kinel_3
    end

    %% Участок Безымянка-Козелковская
    subgraph Section4["📍 Безымянка-Козелковская"]
        class Section4 section

        Bezymyanka_4["🚉 Безымянка"]
        class Bezymyanka_4 station
        Kinel_3 --> Bezymyanka_4
        Bezymyanka_Srednevolzhskaya_4["⮊ Безымянка - Средневолжская"]
        class Bezymyanka_Srednevolzhskaya_4 peregon
        Bezymyanka_4 --> Bezymyanka_Srednevolzhskaya_4
        Srednevolzhskaya_4["🚉 Средневолжская"]
        class Srednevolzhskaya_4 station
        Bezymyanka_Srednevolzhskaya_4 --> Srednevolzhskaya_4
        Srednevolzhskaya_Kozelkovskaya_4["⮊ Средневолжская - Козелковская"]
        class Srednevolzhskaya_Kozelkovskaya_4 peregon
        Srednevolzhskaya_4 --> Srednevolzhskaya_Kozelkovskaya_4
        Kozelkovskaya_4["🚉 Козелковская"]
        class Kozelkovskaya_4 station
        Srednevolzhskaya_Kozelkovskaya_4 --> Kozelkovskaya_4
    end

    %% Участок Безымянка-Самарка
    subgraph Section5["📍 Безымянка-Самарка"]
        class Section5 section

        Bezymyanka_5["🚉 Безымянка"]
        class Bezymyanka_5 station
        Kozelkovskaya_4 --> Bezymyanka_5
    end

    %% Участок Белорецк-Карталы
    subgraph Section6["📍 Белорецк-Карталы"]
        class Section6 section

        Beloretsk_6["🚉 Белорецк"]
        class Beloretsk_6 station
        Bezymyanka_5 --> Beloretsk_6
    end

    %% Участок Бензин-Новоуфимская
    subgraph Section7["📍 Бензин-Новоуфимская"]
        class Section7 section

        Chernik_Vostochnaya_7["🚉 Черник-Восточная"]
        class Chernik_Vostochnaya_7 station
        Beloretsk_6 --> Chernik_Vostochnaya_7
    end

    %% Участок Ветви узла Дема
    subgraph Section8["📍 Ветви узла Дема"]
        class Section8 section

        Lokomotiv_OP_Dema_Yuzh_Park_8["⮊ Локомотив ОП - Дема-Юж. Парк"]
        class Lokomotiv_OP_Dema_Yuzh_Park_8 peregon
        Chernik_Vostochnaya_7 --> Lokomotiv_OP_Dema_Yuzh_Park_8
        Dema_Yuzh_Park_8["🚉 Дема-Юж. Парк"]
        class Dema_Yuzh_Park_8 station
        Lokomotiv_OP_Dema_Yuzh_Park_8 --> Dema_Yuzh_Park_8
    end

    %% Участок Ветвь 1 Сызранского узла
    subgraph Section9["📍 Ветвь 1 Сызранского узла"]
        class Section9 section

        Syzran_I_9["🚉 Сызрань I"]
        class Syzran_I_9 station
        Dema_Yuzh_Park_8 --> Syzran_I_9
    end

    %% Соединения между участками
    Shugurovka_0 -.-> Akbash_1
    Toyma_Alnashi_1 -.-> Post_463_km_Penza_III_2
    Penza_I_2 -.-> Bezenchuk_3
    Kinel_3 -.-> Bezymyanka_4
    Kozelkovskaya_4 -.-> Bezymyanka_5
    Bezymyanka_5 -.-> Beloretsk_6
    Beloretsk_6 -.-> Chernik_Vostochnaya_7
    Chernik_Vostochnaya_7 -.-> Lokomotiv_OP_Dema_Yuzh_Park_8
    Dema_Yuzh_Park_8 -.-> Syzran_I_9
```


**Всего участков:** 56
**Всего объектов:** 876
**Станций:** 452
**Перегонов:** 424
