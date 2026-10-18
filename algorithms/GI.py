import numpy as np
import random
import matplotlib.pyplot as plt
import time

# Fungsi untuk menghitung jarak Euclidean antara dua kota
def calculate_distance(city1, city2):
    return np.sqrt((city1[0] - city2[0])**2 + (city1[1] - city2[1])**2)

# Fungsi untuk menghitung total panjang tour
def total_tour_distance(tour, cities):
    dist = 0
    n = len(tour)
    for i in range(n):
        city_a = cities[tour[i]]
        city_b = cities[tour[(i + 1) % n]]
        dist += calculate_distance(city_a, city_b)
    return dist

# Fungsi General Insertion Heuristic
def general_insertion(cities):
    num_cities = len(cities)
    
    # Jika kota kurang dari atau sama dengan 3, urutan apapun sama saja
    if num_cities <= 3:
        return list(range(num_cities))

    # Inisialisasi: Mulai dari kota pertama (index 0)
    tour = [0]
    unvisited = list(range(1, num_cities))

    # Cari kota terdekat dari kota pertama untuk membentuk sub-tour awal (2 kota)
    nearest_city = min(unvisited, key=lambda c: calculate_distance(cities[0], cities[c]))
    tour.append(nearest_city)
    unvisited.remove(nearest_city)

    # Lakukan iterasi sampai semua kota dikunjungi
    while unvisited:
        best_increase = float('inf')
        best_city = None
        best_position = None

        # Evaluasi setiap kota yang belum dikunjungi
        for city in unvisited:
            # Evaluasi setiap posisi penyisipan di dalam tour saat ini
            for i in range(len(tour)):
                # i - 1 akan merujuk pada elemen terakhir jika i = 0 (karena array di python siklikal dengan index negatif)
                city_a = tour[i - 1]
                city_b = tour[i]

                # Hitung jarak jika 'city' disisipkan di antara 'city_a' dan 'city_b'
                dist_a_city = calculate_distance(cities[city_a], cities[city])
                dist_city_b = calculate_distance(cities[city], cities[city_b])
                dist_a_b = calculate_distance(cities[city_a], cities[city_b])

                # Rumus cost penambahan jarak: C(a, city) + C(city, b) - C(a, b)
                increase = dist_a_city + dist_city_b - dist_a_b

                # Simpan posisi dan kota dengan penambahan jarak terkecil
                if increase < best_increase:
                    best_increase = increase
                    best_city = city
                    best_position = i

        # Masukkan kota terbaik ke posisi terbaik di dalam tour
        tour.insert(best_position, best_city)
        unvisited.remove(best_city)

    return tour