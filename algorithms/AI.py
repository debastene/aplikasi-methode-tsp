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

# 5. Arbitrary Insertion (AI)
def arbitrary_insertion_tsp(cities):
    n = len(cities)
    tour = [0, 1]
    unvisited = list(range(2, n))
    random.shuffle(unvisited)
    
    for city in unvisited:
        best_increase = float('inf')
        best_pos = None
        for i in range(len(tour)):
            c1 = tour[i]
            c2 = tour[(i + 1) % len(tour)]
            increase = calculate_distance(cities[c1], cities[city]) + \
                       calculate_distance(cities[city], cities[c2]) - \
                       calculate_distance(cities[c1], cities[c2])
            if increase < best_increase:
                best_increase = increase
                best_pos = i + 1
        tour.insert(best_pos, city)
    return tour