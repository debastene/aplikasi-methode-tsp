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

# 4. Farthest Insertion (FI)
def farthest_insertion_tsp(cities):
    n = len(cities)
    c1, c2 = 0, np.argmax([calculate_distance(cities[0], cities[i]) for i in range(n)])
    tour = [c1, c2]
    unvisited = set(range(n)) - {c1, c2}
    
    while unvisited:
        # Cari kota yang jarak minimumnya ke tour adalah yang PALING JAUH
        farthest_city = None
        max_min_dist = -1
        best_pos = None
        
        for city in unvisited:
            min_dist_to_tour = min(calculate_distance(cities[city], cities[t]) for t in tour)
            if min_dist_to_tour > max_min_dist:
                max_min_dist = min_dist_to_tour
                farthest_city = city
                
        # Cari posisi penyisipan termurah untuk farthest_city
        best_increase = float('inf')
        for i in range(len(tour)):
            c1_node = tour[i]
            c2_node = tour[(i + 1) % len(tour)]
            increase = calculate_distance(cities[c1_node], cities[farthest_city]) + \
                       calculate_distance(cities[farthest_city], cities[c2_node]) - \
                       calculate_distance(cities[c1_node], cities[c2_node])
            if increase < best_increase:
                best_increase = increase
                best_pos = i + 1
                
        tour.insert(best_pos, farthest_city)
        unvisited.remove(farthest_city)
    return tour