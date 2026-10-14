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

# 2. Nearest Insertion
def nearest_insertion_tsp(cities):
    n = len(cities)
    # Mulai dengan 2 kota terdekat
    d_min = float('inf')
    c1, c2 = 0, 1
    for i in range(n):
        for j in range(i+1, n):
            d = calculate_distance(cities[i], cities[j])
            if d < d_min:
                d_min = d
                c1, c2 = i, j
    
    tour = [c1, c2]
    unvisited = set(range(n)) - {c1, c2}
    
    while unvisited:
        # Cari unvisited kota yang paling dekat dengan *tour yang sudah ada*
        min_dist = float('inf')
        best_city = None
        best_pos = None
        
        for city in unvisited:
            for i in range(len(tour)):
                d = calculate_distance(cities[city], cities[tour[i]])
                if d < min_dist:
                    min_dist = d
                    best_city = city
                    # Cari posisi terbaik untuk menyisipkan
                    best_pos = (i + 1) % len(tour)
                    
        tour.insert(best_pos, best_city)
        unvisited.remove(best_city)
    return tour